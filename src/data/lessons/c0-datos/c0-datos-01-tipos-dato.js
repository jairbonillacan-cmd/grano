const lesson = {
  id: 'c0-datos-01-tipos-dato',
  moduleId: 'c0-datos',
  tracks: ['core'],
  level: 0,
  order: 1,
  title: 'Tipos de dato: entero, decimal, texto, fecha y booleano',
  subtitle: 'Tipos de dato: entero, decimal exacto, texto, fecha y booleano',
  minutes: 15,
  prerequisites: [],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia de café y equipamiento), alguien exporta el catálogo de productos y ordena los precios de mayor a menor. En la primera fila aparece un filtro de papel de 9,50 USD por encima de un molino industrial de 226,17 USD. Además, el precio promedio cae porque hay un artículo de prueba con valor `-9.99`. ¿Por qué el sistema ordenó `"9.50"` antes que `"226.17"` y cómo evitas mezclar precios con textos o registros de calibración?',

  objectives: [
    'Distinguir los cinco tipos de dato básicos (`INTEGER`, `DECIMAL`, `VARCHAR`, `DATE` y `BOOLEAN`) y qué operaciones admite cada uno.',
    'Explicar por qué el dinero se guarda en decimal exacto (`DECIMAL`) en lugar de coma flotante binaria (`DOUBLE`).',
    'Filtrar valores fuera de dominio y convertir tipos explícitamente con `CAST` sobre el catálogo de Mercado Brisa.',
  ],

  sections: [
    {
      id: 'cinco-tipos-basicos-y-su-contrato',
      heading: 'Qué es un tipo de dato y por qué evita errores silenciosos',
      body: 'Para una computadora, todo archivo es una secuencia de ceros y unos. El **tipo de dato** es la regla que indica cómo interpretar esos bits y qué operaciones tienen sentido en una columna.\n\nSi guardas el precio `226.17` como texto (`VARCHAR`), el sistema compara carácter por carácter de izquierda a derecha, igual que en un diccionario. Como el carácter `"9"` va después del `"2"`, ordena `"9.50"` por encima de `"226.17"`. Cuando declaras la columna como número, el motor compara magnitudes matemáticas reales.\n\nEn una tabla de datos conviven cinco familias principales. Usamos enteros (`INTEGER`) para conteos e identificadores como `product_id`, y decimales (`DECIMAL` o `DOUBLE`) para importes y medidas. Además, empleamos texto (`VARCHAR`) para códigos como `sku`, fechas (`DATE` y `TIMESTAMP`) para el calendario, y booleanos (`BOOLEAN`) que solo admiten `true` o `false`.',
    },
    {
      id: 'entero-frente-a-decimal-exacto-y-coma-flotante',
      heading: 'Por qué el dinero requiere decimal exacto y no coma flotante',
      body: 'No todos los números con decimales funcionan igual por dentro. El tipo `DOUBLE` (coma flotante binaria bajo el estándar IEEE 754) representa los números como fracciones en base 2. Igual que `1/3` en base 10 produce un periódico infinito (`0.3333...`), fracciones sencillas como `0.1` o `0.2` no tienen representación exacta en binario. Por eso, al sumar `0.1 + 0.2` en coma flotante obtienes `0.30000000000000004`.\n\nEn cálculos científicos esa diferencia es despreciable, pero en contabilidad acumula descuadres de centavos al sumar miles de pedidos. Los importes monetarios deben operarse como **decimal exacto** (`DECIMAL(10, 2)` o `NUMERIC`). Este tipo almacena cada dígito en base 10 con diez dígitos totales y dos después del punto.\n\nEn la tabla `products` de Mercado Brisa puedes convertir `list_price_usd` con `CAST(list_price_usd AS DECIMAL(10, 2))`. Al mismo tiempo, puedes comprobar qué filas están activas mediante la columna booleana `is_active`.',
      example: {
        language: 'sql',
        code: `SELECT
  product_id,
  sku,
  category,
  CAST(list_price_usd AS DECIMAL(10, 2)) AS precio_exacto_usd,
  is_active,
  CAST(launch_date AS VARCHAR) AS launch_date
FROM products
WHERE product_id IN (1, 2, 3, 180)
ORDER BY product_id;`,
        expectedOutput: [
          {
            product_id: 1,
            sku: 'MB-CAF-001',
            category: 'Café en grano',
            precio_exacto_usd: 39.76,
            is_active: true,
            launch_date: '2024-05-18',
          },
          {
            product_id: 2,
            sku: 'MB-MOL-002',
            category: 'Molinos',
            precio_exacto_usd: 226.17,
            is_active: true,
            launch_date: '2023-02-16',
          },
          {
            product_id: 3,
            sku: 'MB-CAF-003',
            category: 'Cafeteras',
            precio_exacto_usd: 143.78,
            is_active: true,
            launch_date: '2024-07-08',
          },
          {
            product_id: 180,
            sku: 'SKU-TEST-NEG',
            category: 'Accesorios',
            precio_exacto_usd: -9.99,
            is_active: false,
            launch_date: '2023-01-15',
          },
        ],
      },
    },
    {
      id: 'fechas-iso-booleanos-y-dominio-valido',
      heading: 'Fechas ISO 8601, booleanos y validación de valores posibles',
      body: 'Una fecha escrita como `"04/05/2024"` es ambigua: en Madrid o Bogotá significa 4 de mayo, pero en Miami se lee como 5 de abril. El estándar internacional **ISO 8601** resuelve el conflicto ordenando de la unidad mayor a la menor: `YYYY-MM-DD` (por ejemplo, `2024-05-18` en `launch_date`). Con ese formato, el orden alfabético y el orden cronológico coinciden siempre.\n\nPor su parte, una columna `BOOLEAN` como `is_active` guarda únicamente `true` o `false` sin depender de textos como `"Sí"`, `"S"`, `"1"` o `"Activo"` que cada persona escribe distinto.\n\nQue un dato tenga el tipo correcto no garantiza que sea válido para el negocio. En `products`, el registro `product_id = 180` (`SKU-TEST-NEG`) tiene un número válido (`-9.99`), pero es un artículo de calibración inactivo (`is_active = false`). Antes de promediar precios, debes filtrar tanto el estado booleano como el rango positivo.',
    },
  ],

  workedExample: {
    title: 'Auditoría de tipos y precios válidos en el catálogo de Mercado Brisa',
    description:
      'Compara el cálculo directo sobre toda la tabla `products` (contaminado por el SKU de prueba inactivo con precio `-9.99`) frente a la consulta que filtra con `is_active = true`, valida el dominio positivo y convierte a `DECIMAL(10, 2)`.',
    steps: [
      {
        label: 'Enfoque ingenuo: promediar sin revisar booleanos ni rango de precios',
        explanation:
          'Si calculas el mínimo y el promedio sobre las 180 filas de `products` sin filtrar `is_active` ni descartar importes negativos, el SKU de calibración (`-9.99`) distorsiona las estadísticas del catálogo.',
        code: `SELECT
  COUNT(*) AS skus_evaluados,
  ROUND(MIN(list_price_usd), 2) AS precio_minimo_usd,
  ROUND(AVG(list_price_usd), 2) AS precio_promedio_usd
FROM products;`,
        expectedOutput: [
          {
            skus_evaluados: 180,
            precio_minimo_usd: -9.99,
            precio_promedio_usd: 77.15,
          },
        ],
      },
      {
        label: 'Solución verificada: filtrar booleanos activos y operar en DECIMAL(10, 2)',
        explanation:
          'Al exigir `is_active = true AND list_price_usd > 0` y convertir el importe con `CAST(list_price_usd AS DECIMAL(10, 2))`, quedan los 170 productos comerciales reales y el precio mínimo pasa a ser `11.92` USD.',
        code: `SELECT
  COUNT(*) AS skus_evaluados,
  ROUND(MIN(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_minimo_usd,
  ROUND(AVG(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_promedio_usd
FROM products
WHERE is_active = true
  AND list_price_usd > 0;`,
        expectedOutput: [
          {
            skus_evaluados: 170,
            precio_minimo_usd: 11.92,
            precio_promedio_usd: 77.51,
          },
        ],
      },
    ],
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt:
        'En una columna guardada por error como texto (`VARCHAR`), tienes los valores `"100"`, `"25"` y `"9"`. Si ordenas de menor a mayor (`ORDER BY columna ASC`), ¿en qué orden aparecen?',
      options: [
        {
          id: 'a',
          text: '"100", "25", "9", porque el texto se ordena carácter por carácter de izquierda a derecha.',
          correct: true,
          feedback:
            'Correcto. En orden lexicográfico el carácter "1" va antes que el "2", y el "2" antes que el "9", sin importar la longitud total.',
        },
        {
          id: 'b',
          text: '"9", "25", "100", porque el motor convierte automáticamente cualquier texto con dígitos a entero.',
          correct: false,
          feedback:
            'Incorrecto. Una columna VARCHAR se ordena alfabéticamente a menos que la conviertas explícitamente con CAST.',
        },
        {
          id: 'c',
          text: 'La consulta falla con un error porque no se puede usar ORDER BY sobre columnas de texto.',
          correct: false,
          feedback:
            'Incorrecto. ORDER BY funciona sobre texto, fechas y números, pero aplica las reglas del tipo de dato de la columna.',
        },
      ],
      explanation:
        'El tipo de dato define cómo se comparan dos valores. En VARCHAR el orden es alfabético ("100" < "25" < "9"); en INTEGER o DECIMAL es por magnitud numérica (9 < 25 < 100).',
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt:
        'Necesitas almacenar el precio unitario de los productos y el total facturado en dólares para cuadrar la contabilidad al centavo. ¿Qué tipo de dato debes elegir?',
      options: [
        {
          id: 'a',
          text: 'DECIMAL(10, 2) (o NUMERIC), porque guarda los centavos exactos en base 10 sin error de redondeo binario.',
          correct: true,
          feedback:
            'Exacto. DECIMAL(10, 2) almacena la fracción decimal exacta en base 10 y evita los residuos de coma flotante.',
        },
        {
          id: 'b',
          text: 'DOUBLE, porque al usar 64 bits en base 2 representa cualquier fracción decimal sin pérdida.',
          correct: false,
          feedback:
            'Incorrecto. En base 2 fracciones como 0.1 o 0.2 son periódicas infinitas y acumulan residuos al sumar.',
        },
        {
          id: 'c',
          text: 'VARCHAR con el símbolo "$" delante, para que nadie olvide la moneda.',
          correct: false,
          feedback:
            'Incorrecto. Incluir símbolos de moneda en texto impide sumar o promediar la columna directamente.',
        },
      ],
      explanation:
        'Los tipos de coma flotante binaria (REAL, DOUBLE) aproximan fracciones en base 2. Para importes monetarios se utiliza siempre DECIMAL(p, s) o enteros de centavos.',
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt:
        'Completa la expresión SQL para convertir la columna `list_price_usd` a decimal exacto de 10 dígitos y 2 decimales, filtrando solo los productos activos:',
      template:
        'SELECT CAST(list_price_usd AS {{b1}}(10, 2)) AS precio_usd FROM products WHERE is_active = {{b2}};',
      blanks: [
        { id: 'b1', accepted: ['DECIMAL', 'NUMERIC', 'decimal', 'numeric'] },
        { id: 'b2', accepted: ['true', 'TRUE'] },
      ],
      explanation:
        'La función estándar CAST(columna AS DECIMAL(10, 2)) convierte el valor a decimal exacto en base 10, mientras que la columna booleana is_active se compara con el literal true.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Resumen de precios exactos por categoría en products',
    language: 'sql',
    prompt:
      'Consulta la tabla `products` de Mercado Brisa filtrando únicamente los productos comerciales activos con precio positivo (`WHERE is_active = true AND list_price_usd > 0`). Calcula por cada `category`: el conteo `skus_activos`, el precio mínimo exacto `precio_min_usd` y el precio máximo exacto `precio_max_usd` convirtiendo `list_price_usd` a `DECIMAL(10, 2)` y redondeando a 2 decimales. Ordena el resultado por `precio_max_usd DESC`.',
    starterCode: `SELECT
  category,
  COUNT(*) AS skus_activos,
  ROUND(MIN(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_min_usd,
  ROUND(MAX(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_max_usd
FROM products
-- TODO: Filtra solo productos con is_active = true y list_price_usd > 0
WHERE is_active = true
GROUP BY category
ORDER BY precio_max_usd DESC;`,
    expected: `SELECT
  category,
  COUNT(*) AS skus_activos,
  ROUND(MIN(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_min_usd,
  ROUND(MAX(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_max_usd
FROM products
WHERE is_active = true
  AND list_price_usd > 0
GROUP BY category
ORDER BY precio_max_usd DESC;`,
    orderMatters: true,
    blanks: [{ id: 'b1', answer: 'AND list_price_usd > 0' }],
    hints: [
      'En la cláusula `WHERE`, añade `AND list_price_usd > 0` junto a `is_active = true` para garantizar que ningún precio negativo o cero entre al resumen.',
      'Mantén los nombres exactos de las columnas proyectadas: `category`, `skus_activos`, `precio_min_usd` y `precio_max_usd`.',
      'Agrupa con `GROUP BY category` y ordena de mayor a menor precio máximo con `ORDER BY precio_max_usd DESC`.',
    ],
    solution: `SELECT
  category,
  COUNT(*) AS skus_activos,
  ROUND(MIN(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_min_usd,
  ROUND(MAX(CAST(list_price_usd AS DECIMAL(10, 2))), 2) AS precio_max_usd
FROM products
WHERE is_active = true
  AND list_price_usd > 0
GROUP BY category
ORDER BY precio_max_usd DESC;`,
    solutionExplanation:
      'Filtra los productos activos y con precio mayor que cero antes de agrupar por categoría, convirtiendo `list_price_usd` a `DECIMAL(10, 2)` para obtener los rangos exactos de las 5 categorías.',
    expectedOutputTable: [
      {
        category: 'Molinos',
        skus_activos: 34,
        precio_min_usd: 69.7,
        precio_max_usd: 237.01,
      },
      {
        category: 'Cafeteras',
        skus_activos: 34,
        precio_min_usd: 38.9,
        precio_max_usd: 191.62,
      },
      {
        category: 'Suscripciones',
        skus_activos: 34,
        precio_min_usd: 24.62,
        precio_max_usd: 74.47,
      },
      {
        category: 'Accesorios',
        skus_activos: 34,
        precio_min_usd: 11.92,
        precio_max_usd: 66.28,
      },
      {
        category: 'Café en grano',
        skus_activos: 34,
        precio_min_usd: 15.25,
        precio_max_usd: 41.35,
      },
    ],
  },

  roleNotes: {
    de: 'En Ingeniería de Datos defines los tipos al ingerir archivos crudos: convierte cadenas ISO a DATE o TIMESTAMP y exige DECIMAL(12, 2) en columnas financieras antes de publicar la tabla.',
    da: 'En Análisis de Datos revisas los tipos y rangos antes de calcular medias: un solo código de prueba como -9.99 o un booleano inactivo sesga todo tu resumen estadístico.',
    bi: 'En Business Intelligence verificas que el modelo semántico reciba fechas reales para las jerarquías de calendario y números decimales fijos para no mostrar residuos de coma flotante en tableros.',
  },

  summary: [
    'El tipo de dato define cómo se guarda un valor y qué operaciones permite.',
    'Ordenar números guardados como VARCHAR compara caracteres de izquierda a derecha ("9" > "226").',
    'Usa DECIMAL(p, s) para dinero; DOUBLE usa fracciones binarias IEEE 754 con redondeos inexactos.',
    'Las fechas en formato ISO 8601 (YYYY-MM-DD) eliminan la ambigüedad entre día y mes.',
  ],

  flashcards: [
    {
      id: 'fc-c0-datos-01-a',
      front: '¿Por qué no debes usar DOUBLE o FLOAT para sumar importes de dinero?',
      back: 'Porque representan los números en binario (IEEE 754), donde fracciones como 0.1 o 0.2 son inexactas y acumulan errores de centavos. Para dinero se usa DECIMAL(p, s).',
    },
    {
      id: 'fc-c0-datos-01-b',
      front: '¿Qué ocurre si ordenas de menor a mayor los valores "100", "20" y "3" en una columna VARCHAR?',
      back: 'Se ordenan carácter por carácter como en un diccionario: "100", luego "20" y al final "3".',
    },
    {
      id: 'fc-c0-datos-01-c',
      front: '¿Por qué el formato de fecha ISO 8601 (YYYY-MM-DD) es el estándar en bases de datos?',
      back: 'Porque va de la unidad mayor (año) a la menor (día), evita confundir día con mes y su orden alfabético coincide con el cronológico.',
    },
  ],

  glossaryTerms: ['c0-tipo-dato', 'c0-decimal-exacto'],

  sources: [
    {
      title: 'PostgreSQL 17 Documentation — Chapter 8: Data Types (Numeric, Character, Date/Time, Boolean)',
      url: 'https://www.postgresql.org/docs/current/datatype.html',
      publisher: 'PostgreSQL Global Development Group',
      accessed: '2026-10-29',
      supports:
        'Clasificación de tipos numéricos exactos (INTEGER, NUMERIC/DECIMAL) frente a coma flotante (DOUBLE PRECISION), texto, fechas y booleanos.',
    },
    {
      title: 'DuckDB Documentation — Data Types Overview',
      url: 'https://duckdb.org/docs/sql/data_types/overview.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Comportamiento de los tipos INTEGER, DECIMAL, DOUBLE, VARCHAR, DATE y BOOLEAN en DuckDB y conversión explícita con CAST.',
    },
    {
      title: 'IEEE Standard for Floating-Point Arithmetic (IEEE 754-2019)',
      url: 'https://ieeexplore.ieee.org/document/8766229',
      publisher: 'IEEE Computer Society',
      accessed: '2026-10-29',
      supports:
        'Representación binaria de números en coma flotante y causa matemática de que 0.1 + 0.2 no sea exactamente 0.3 en base 2.',
    },
  ],

  aiNotes:
    'La persona empieza desde cero absoluto (Nivel 0). El malentendido más común es pensar que cambiar el formato visual en una hoja de cálculo cambia el tipo real del dato, o no entender por qué 0.1 + 0.2 falla en binario. Usa ejemplos cotidianos con los precios de Mercado Brisa.',
};

export default lesson;
