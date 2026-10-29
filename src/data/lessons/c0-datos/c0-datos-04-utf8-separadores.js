const lesson = {
  id: 'c0-datos-04-utf8-separadores',
  moduleId: 'c0-datos',
  tracks: ['core'],
  level: 0,
  order: 4,
  title: 'Codificación UTF-8, separadores decimales y caracteres rotos',
  subtitle: 'Cómo evitar texto corrupto y errores de coma decimal al intercambiar archivos entre países',
  minutes: 15,
  prerequisites: ['c0-datos-03-formatos-archivo'],
  contentVersion: 1,

  hook: 'El equipo regional de Mercado Brisa en Colombia recibe el reporte de tiendas exportado desde Ciudad de México. Al abrirlo, ve que `"Bogotá"` aparece escrito como `"BogotÃ¡"` y `"Medellín"` como `"MedellÃ­n"`. Al mismo tiempo, la hoja de cálculo en Madrid interpreta el importe `"12,50"` como texto en unas columnas y como doce mil quinientos en otras. ¿Por qué las computadoras deforman las tildes y los decimales al cruzar fronteras, y cómo se protegen los archivos contra ese daño?',

  objectives: [
    'Explicar cómo la codificación UTF-8 convierte caracteres humanos en bytes y por qué aparece el fenómeno mojibake (`"BogotÃ¡"`).',
    'Comparar el conteo de caracteres Unicode (`LENGTH`) frente al conteo de bytes UTF-8 (`STRLEN`) en SQL.',
    'Prevenir colisiones entre comas decimales, delimitadores CSV y formatos regionales de fecha usando estándares neutros.',
  ],

  sections: [
    {
      id: 'utf8-y-mojibake',
      heading: 'De letras a bytes: codificación UTF-8 y el fenómeno mojibake',
      body: 'En el interior de una computadora no existen letras ni tildes, sino secuencias de bytes numéricos. Una tabla de codificación es el acuerdo que traduce cada carácter humano a su representación en bytes. Durante décadas coexistieron tablas regionales incompatibles. Los sistemas antiguos de Europa occidental y América Latina usaban **Windows-1252** o ISO-8859-1. Allí cada carácter ocupaba siempre un solo byte y solo cabían 256 símbolos.\n\nPara resolver esa fragmentación nació el estándar **UTF-8** (RFC 3629), que hoy es el formato universal en la web. UTF-8 utiliza longitud variable: las letras inglesas sin tilde (ASCII) ocupan 1 byte. En cambio, las vocales acentuadas (`á`, `é`, `í`, `ó`, `ú`) y la letra `ñ` ocupan 2 bytes.\n\nEl fenómeno conocido como **mojibake** ocurre cuando un archivo guardado en UTF-8 se abre con un programa que asume Windows-1252. Los 2 bytes de la letra `á` (`0xC3` y `0xA1`) se leen como dos caracteres separados y producen la secuencia rota `Ã¡`. En DuckDB puedes comprobar esta diferencia comparando `LENGTH(city)` (caracteres Unicode) frente a `STRLEN(city)` (bytes en UTF-8).',
      example: {
        language: 'sql',
        code: `SELECT
  store_code,
  city,
  country_code,
  LENGTH(city) AS caracteres_unicode,
  STRLEN(city) AS bytes_utf8
FROM stores
WHERE store_id IN (1, 3, 4, 5, 10)
ORDER BY store_id;`,
        expectedOutput: [
          {
            store_code: 'STR-MX-01',
            city: 'Ciudad de México',
            country_code: 'MX',
            caracteres_unicode: 16,
            bytes_utf8: 17,
          },
          {
            store_code: 'STR-MX-03',
            city: 'Guadalajara',
            country_code: 'MX',
            caracteres_unicode: 11,
            bytes_utf8: 11,
          },
          {
            store_code: 'STR-CO-01',
            city: 'Bogotá',
            country_code: 'CO',
            caracteres_unicode: 6,
            bytes_utf8: 7,
          },
          {
            store_code: 'STR-CO-02',
            city: 'Medellín',
            country_code: 'CO',
            caracteres_unicode: 8,
            bytes_utf8: 9,
          },
          {
            store_code: 'STR-ES-01',
            city: 'Madrid',
            country_code: 'ES',
            caracteres_unicode: 6,
            bytes_utf8: 6,
          },
        ],
      },
    },
    {
      id: 'separadores-decimales-y-csv',
      heading: 'Coma frente a punto decimal y el choque con los delimitadores CSV',
      body: 'El segundo gran foco de corrupción al compartir archivos entre países es la convención numérica local. México, Perú y los lenguajes de programación escriben los decimales con punto (`14.80`). Por el contrario, España, Argentina, Chile y Colombia utilizan tradicionalmente la coma decimal (`14,80`) y reservan el punto para separar miles (`1.250,80`).\n\nEste hábito regional choca de frente con el formato **CSV** (*Comma-Separated Values*). Imagina que alguien exporta un CSV sin comillas donde la coma actúa a la vez como separador de columnas y de decimales. La línea `101,Café Molido,14,80` se parte en cuatro columnas en lugar de tres. El lector cree que el precio es `14` y que existe una cuarta columna con el valor `80`.\n\nPor eso las hojas de cálculo regionales suelen cambiar el delimitador a punto y coma (`;`). Sin embargo, en ingeniería de datos se exige un contrato neutro: codificación **UTF-8**, punto (`.`) para decimales y ningún separador de miles.',
    },
    {
      id: 'fechas-y-formatos-crudos',
      heading: 'Formatos regionales de fecha y marcas horarias en texto crudo',
      body: 'La ambigüedad regional también afecta a las fechas escritas como texto. La cadena `"04/05/2025"` significa 4 de mayo en Madrid, Bogotá o Buenos Aires (`DD/MM/AAAA`). Pero se lee como 5 de abril en sistemas configurados con convención estadounidense (`MM/DD/AAAA`). Si un proceso automático lee ese texto asumiendo el orden equivocado, desplazará las ventas de todo un mes sin avisar.\n\nEn la tabla `events` de Mercado Brisa se conserva la columna `event_ts_raw` con la marca temporal cruda enviada por cada país. Allí conviven desplazamientos horarios como `-06:00` en México, `-05:00` en Colombia y Perú, `-03:00` en Argentina y Chile, `+01:00` en España o `Z` en tiempo universal coordinado (UTC).\n\nAdoptar el estándar **ISO 8601** (`AAAA-MM-DD` para fechas y `AAAA-MM-DDTHH:MM:SS±HH:MM` para marcas horarias) elimina cualquier confusión entre día y mes.',
    },
  ],

  workedExample: {
    title: 'Auditoría de marcas horarias crudas y caracteres UTF-8 en Mercado Brisa',
    description:
      'Inspecciona primero cómo llegan las marcas de tiempo en texto crudo (`event_ts_raw`) desde cinco husos horarios distintos en `events`, y luego identifica en `stores` qué ciudades contienen tildes multibyte comparando `STRLEN(city)` con `LENGTH(city)`.',
    steps: [
      {
        label: 'Paso 1: Inspeccionar marcas de tiempo crudas ISO 8601 por huso horario en events',
        explanation:
          'Agrupamos `events` por `timezone_offset` y tomamos el primer valor de `event_ts_raw`. Cada país envía su desplazamiento horario explícito en formato ISO 8601, lo que permite normalizar los 65 000 eventos sin ambigüedad.',
        code: `SELECT
  timezone_offset,
  COUNT(*) AS eventos,
  MIN(event_ts_raw) AS muestra_texto_crudo
FROM events
GROUP BY timezone_offset
ORDER BY timezone_offset ASC;`,
        expectedOutput: [
          {
            timezone_offset: '+01:00',
            eventos: 13000,
            muestra_texto_crudo: '2023-01-01T01:37:15+01:00',
          },
          {
            timezone_offset: '-03:00',
            eventos: 13000,
            muestra_texto_crudo: '2023-01-01T00:14:03-03:00',
          },
          {
            timezone_offset: '-05:00',
            eventos: 13000,
            muestra_texto_crudo: '2023-01-01T01:35:05-05:00',
          },
          {
            timezone_offset: '-06:00',
            eventos: 13000,
            muestra_texto_crudo: '2023-01-01T01:48:22-06:00',
          },
          {
            timezone_offset: 'Z',
            eventos: 13000,
            muestra_texto_crudo: '2023-01-01T09:31:04Z',
          },
        ],
      },
      {
        label: 'Paso 2: Detectar sedes con vocales acentuadas comparando STRLEN y LENGTH',
        explanation:
          'Filtramos `stores` donde `STRLEN(city) > LENGTH(city)`. Aparecen exactamente las 6 tiendas y almacenes ubicados en Ciudad de México, Bogotá y Medellín, cuyos nombres contienen una vocal con tilde que ocupa 2 bytes en UTF-8.',
        code: `SELECT
  store_code,
  city,
  country_code,
  LENGTH(city) AS caracteres,
  STRLEN(city) AS bytes_utf8,
  STRLEN(city) - LENGTH(city) AS bytes_extra_tildes
FROM stores
WHERE STRLEN(city) > LENGTH(city)
ORDER BY store_id;`,
        expectedOutput: [
          {
            store_code: 'STR-MX-01',
            city: 'Ciudad de México',
            country_code: 'MX',
            caracteres: 16,
            bytes_utf8: 17,
            bytes_extra_tildes: 1,
          },
          {
            store_code: 'STR-MX-02',
            city: 'Ciudad de México',
            country_code: 'MX',
            caracteres: 16,
            bytes_utf8: 17,
            bytes_extra_tildes: 1,
          },
          {
            store_code: 'STR-CO-01',
            city: 'Bogotá',
            country_code: 'CO',
            caracteres: 6,
            bytes_utf8: 7,
            bytes_extra_tildes: 1,
          },
          {
            store_code: 'STR-CO-02',
            city: 'Medellín',
            country_code: 'CO',
            caracteres: 8,
            bytes_utf8: 9,
            bytes_extra_tildes: 1,
          },
          {
            store_code: 'WH-MX-01',
            city: 'Ciudad de México',
            country_code: 'MX',
            caracteres: 16,
            bytes_utf8: 17,
            bytes_extra_tildes: 1,
          },
          {
            store_code: 'WH-CO-01',
            city: 'Bogotá',
            country_code: 'CO',
            caracteres: 6,
            bytes_utf8: 7,
            bytes_extra_tildes: 1,
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
        'Si abres un archivo CSV en tu hoja de cálculo y el nombre `"Bogotá"` se muestra en pantalla como `"BogotÃ¡"`, ¿qué ocurrió realmente con el archivo?',
      options: [
        {
          id: 'a',
          text: 'El archivo fue guardado en UTF-8 (donde "á" ocupa 2 bytes), pero el programa lector lo abrió asumiendo una tabla antigua de 1 byte como Windows-1252.',
          correct: true,
          feedback:
            'Exacto. Los dos bytes de "á" en UTF-8 se interpretan por separado en Windows-1252 y forman la secuencia "Ã¡" (mojibake).',
        },
        {
          id: 'b',
          text: 'El archivo se dañó físicamente durante la descarga por red y perdió la mitad de sus filas.',
          correct: false,
          feedback:
            'Incorrecto. Los bytes en disco están intactos; basta con reabrir el archivo indicando codificación UTF-8.',
        },
        {
          id: 'c',
          text: 'El nombre de la ciudad se guardó como tipo numérico DECIMAL en lugar de VARCHAR.',
          correct: false,
          feedback:
            'Incorrecto. Si se hubiera intentado convertir a número habría dado error de tipo, no caracteres "Ã¡".',
        },
      ],
      explanation:
        'La secuencia "Ã¡" es la huella clásica de mojibake: los dos bytes que representan la letra "á" en UTF-8 se leen como dos caracteres individuales en una codificación de 1 byte por carácter como Windows-1252.',
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt:
        'Un archivo CSV usa la coma (`,`) como delimitador de columnas y alguien exporta la fila `101,Café Molido,14,80` usando coma decimal sin comillas. ¿Cómo la interpreta el lector CSV?',
      options: [
        {
          id: 'a',
          text: 'La divide en cuatro columnas: 101, "Café Molido", 14 y 80, desplazando la estructura de esa fila.',
          correct: true,
          feedback:
            'Correcto. Sin comillas protectoras, cada coma en un CSV se interpreta literalmente como un separador de columna.',
        },
        {
          id: 'b',
          text: 'Detecta automáticamente el idioma español y une 14 con 80 en el número decimal 14.80.',
          correct: false,
          feedback:
            'Incorrecto. Un parser CSV estándar corta por cada coma a menos que el campo esté entrecomillado o se configure otro delimitador.',
        },
        {
          id: 'c',
          text: 'Convierte toda la fila en NULL para evitar errores.',
          correct: false,
          feedback:
            'Incorrecto. El lector parte la línea en más columnas de las esperadas, provocando un error de esquema o datos corridos.',
        },
      ],
      explanation:
        'En texto plano CSV sin comillas, la coma dentro de 14,80 es indistinguible del separador de columnas y parte el número en dos campos distintos.',
    },
    {
      id: 'c3',
      type: 'fill-code',
      prompt:
        'Completa la consulta en DuckDB para contar cuántos caracteres Unicode (`LENGTH`) y cuántos bytes UTF-8 (`STRLEN`) tiene la columna `city`:',
      template:
        'SELECT city, {{b1}}(city) AS caracteres, {{b2}}(city) AS bytes_utf8 FROM stores;',
      blanks: [
        { id: 'b1', accepted: ['LENGTH', 'length'] },
        { id: 'b2', accepted: ['STRLEN', 'strlen'] },
      ],
      explanation:
        'En DuckDB, LENGTH(texto) cuenta el número de puntos de código Unicode (letras humanas), mientras que STRLEN(texto) devuelve cuántos bytes ocupa esa cadena en codificación UTF-8.',
    },
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de caracteres y bytes UTF-8 por ciudad en stores',
    language: 'sql',
    prompt:
      'Agrupa la tabla `stores` de Mercado Brisa por `country_code` y `city` para obtener las 9 ciudades donde opera la empresa. Calcula por cada ciudad el conteo de sedes `total_tiendas`, la longitud en caracteres `caracteres` (`LENGTH(city)`) y la longitud en bytes UTF-8 `bytes_utf8` (`STRLEN(city)`). Ordena el resultado por `bytes_utf8 DESC, city ASC`.',
    starterCode: `SELECT
  country_code,
  city,
  COUNT(*) AS total_tiendas,
  LENGTH(city) AS caracteres,
  -- TODO: Calcula el número de bytes en UTF-8 de la columna city
  ___ AS bytes_utf8
FROM stores
GROUP BY country_code, city
ORDER BY bytes_utf8 DESC, city ASC;`,
    expected: `SELECT
  country_code,
  city,
  COUNT(*) AS total_tiendas,
  LENGTH(city) AS caracteres,
  STRLEN(city) AS bytes_utf8
FROM stores
GROUP BY country_code, city
ORDER BY bytes_utf8 DESC, city ASC;`,
    orderMatters: true,
    blanks: [{ id: 'b1', answer: 'STRLEN(city)' }],
    hints: [
      'En DuckDB, `LENGTH(city)` cuenta caracteres Unicode y `STRLEN(city)` cuenta cuántos bytes ocupa la cadena en UTF-8.',
      'Reemplaza `___` por `STRLEN(city)` manteniendo el alias `AS bytes_utf8`.',
      'Conserva `GROUP BY country_code, city` y `ORDER BY bytes_utf8 DESC, city ASC` para que las 9 ciudades aparezcan en el orden esperado.',
    ],
    solution: `SELECT
  country_code,
  city,
  COUNT(*) AS total_tiendas,
  LENGTH(city) AS caracteres,
  STRLEN(city) AS bytes_utf8
FROM stores
GROUP BY country_code, city
ORDER BY bytes_utf8 DESC, city ASC;`,
    solutionExplanation:
      'Agrupa las 14 sedes de `stores` en sus 9 ciudades únicas y compara `LENGTH(city)` con `STRLEN(city)`, mostrando que Ciudad de México (16 caracteres, 17 bytes), Medellín (8, 9) y Bogotá (6, 7) ocupan un byte extra por su tilde en UTF-8.',
    expectedOutputTable: [
      {
        country_code: 'MX',
        city: 'Ciudad de México',
        total_tiendas: 3,
        caracteres: 16,
        bytes_utf8: 17,
      },
      {
        country_code: 'AR',
        city: 'Buenos Aires',
        total_tiendas: 1,
        caracteres: 12,
        bytes_utf8: 12,
      },
      {
        country_code: 'MX',
        city: 'Guadalajara',
        total_tiendas: 1,
        caracteres: 11,
        bytes_utf8: 11,
      },
      {
        country_code: 'ES',
        city: 'Barcelona',
        total_tiendas: 1,
        caracteres: 9,
        bytes_utf8: 9,
      },
      {
        country_code: 'CO',
        city: 'Medellín',
        total_tiendas: 1,
        caracteres: 8,
        bytes_utf8: 9,
      },
      {
        country_code: 'CL',
        city: 'Santiago',
        total_tiendas: 2,
        caracteres: 8,
        bytes_utf8: 8,
      },
      {
        country_code: 'CO',
        city: 'Bogotá',
        total_tiendas: 2,
        caracteres: 6,
        bytes_utf8: 7,
      },
      {
        country_code: 'ES',
        city: 'Madrid',
        total_tiendas: 2,
        caracteres: 6,
        bytes_utf8: 6,
      },
      {
        country_code: 'PE',
        city: 'Lima',
        total_tiendas: 1,
        caracteres: 4,
        bytes_utf8: 4,
      },
    ],
  },

  roleNotes: {
    de: 'En Ingeniería de Datos exiges siempre UTF-8 estricto, decimales con punto y marcas de tiempo en ISO 8601 con huso horario explícito en todos los contratos de ingesta.',
    da: 'En Análisis de Datos inspeccionas las primeras líneas de cualquier CSV externo en texto plano para verificar su codificación, su delimitador de columnas y su separador decimal antes de importarlo.',
    bi: 'En Business Intelligence vigilas que no se filtren nombres con mojibake ("BogotÃ¡") a los filtros de los tableros, porque dividen una misma ciudad en dos categorías distintas.',
  },

  summary: [
    'La codificación UTF-8 usa 1 byte para caracteres ASCII y 2 bytes para vocales con tilde o la letra ñ.',
    'El mojibake ("BogotÃ¡") ocurre al abrir un archivo UTF-8 asumiendo una tabla antigua de 1 byte como Windows-1252.',
    'Escribir decimales con coma dentro de un CSV separado por comas rompe las columnas si no se entrecomilla.',
    'Usar UTF-8, punto decimal y fechas en ISO 8601 (AAAA-MM-DD) evita errores al compartir datos entre países.',
  ],

  flashcards: [
    {
      id: 'fc-c0-datos-04-a',
      front: '¿Por qué la palabra "Bogotá" tiene 6 caracteres pero ocupa 7 bytes en UTF-8?',
      back: 'Porque las primeras cinco letras son ASCII (1 byte cada una) y la vocal acentuada "á" se codifica con 2 bytes en UTF-8 (5 + 2 = 7 bytes).',
    },
    {
      id: 'fc-c0-datos-04-b',
      front: '¿Qué causa que aparezcan textos como "MedellÃ­n" o "CancÃºn" (mojibake)?',
      back: 'Leer con una codificación de 1 byte (como Windows-1252 o ISO-8859-1) un archivo cuyos caracteres acentuados fueron guardados en UTF-8 (2 bytes).',
    },
    {
      id: 'fc-c0-datos-04-c',
      front: '¿Qué tres reglas evitan errores regionales al exportar un archivo de datos?',
      back: 'Guardar el texto en codificación UTF-8, usar siempre punto (.) como separador decimal sin separador de miles, y formatear fechas en ISO 8601 (AAAA-MM-DD).',
    },
  ],

  glossaryTerms: ['c0-codificacion-utf8', 'c0-mojibake'],

  sources: [
    {
      title: 'RFC 3629 — UTF-8, a transformation format of ISO 10646',
      url: 'https://datatracker.ietf.org/doc/html/rfc3629',
      publisher: 'Internet Engineering Task Force (IETF)',
      accessed: '2026-10-29',
      supports:
        'Especificación oficial de la codificación multibyte UTF-8 (de 1 a 4 bytes por punto de código Unicode) y compatibilidad con ASCII.',
    },
    {
      title: 'The Unicode Standard — Core Specification',
      url: 'https://www.unicode.org/versions/latest/',
      publisher: 'Unicode Consortium',
      accessed: '2026-10-29',
      supports:
        'Asignación universal de puntos de código para caracteres internacionales y distinción entre punto de código y secuencia de bytes.',
    },
    {
      title: 'DuckDB Documentation — Text Functions (LENGTH vs STRLEN) and CSV Import',
      url: 'https://duckdb.org/docs/sql/functions/char.html',
      publisher: 'DuckDB Foundation',
      accessed: '2026-10-29',
      supports:
        'Diferencia práctica entre contar puntos de código Unicode con LENGTH() y contar bytes UTF-8 con STRLEN() en consultas SQL.',
    },
  ],

  aiNotes:
    'La persona aprende desde cero (Nivel 0). Suele creer que "BogotÃ¡" significa que el archivo se borró o corrompió sin remedio. Explícale paso a paso que los 2 bytes de la "á" en UTF-8 siguen intactos y que solo hace falta leerlos con la tabla correcta.',
};

export default lesson;
