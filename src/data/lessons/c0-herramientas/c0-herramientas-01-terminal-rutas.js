const lesson = {
  id: 'c0-herramientas-01-terminal-rutas',
  moduleId: 'c0-herramientas',
  tracks: ['core'],
  level: 0,
  order: 1,
  title: 'La terminal sin miedo: rutas, archivos y tuberías',
  minutes: 15,
  prerequisites: [],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el equipo recibe un archivo de eventos web con 65 000 filas y el catálogo `stores.csv`. Un analista intenta abrir un registro histórico de varios gigabytes haciendo doble clic en su hoja de cálculo y bloquea su portátil durante veinte minutos. Otro escribe la ruta `C:\\Usuarios\\Diego\\Escritorio\\stores.csv` en su script y falla al compartirlo. ¿Cómo inspeccionas archivos de cualquier tamaño en un segundo y usas rutas que funcionen en cualquier equipo?',

  objectives: [
    'Distinguir entre una ruta absoluta y una ruta relativa al directorio de trabajo actual (`pwd`).',
    'Inspeccionar el tamaño, las primeras líneas y el conteo de filas de un archivo con `ls -lh`, `head`, `tail` y `wc -l`.',
    'Encadenar comandos con tuberías (`|`) y `grep` para filtrar registros sin cargar el archivo entero en memoria.'
  ],

  sections: [
    {
      id: 'ubicacion-y-rutas-relativas-frente-a-absolutas',
      heading: 'Cómo ubicarte en carpetas sin depender de tu disco personal',
      body: 'La terminal es un intérprete de texto que ejecuta órdenes dentro de una carpeta activa llamada directorio de trabajo. Al escribir `pwd` (*print working directory*), la terminal responde en qué carpeta estás parado. Con `ls -lh` listas los archivos visibles junto con su peso legible en kilobytes o megabytes, y con `cd` cambias de carpeta.\n\nPara apuntar a un archivo existen dos formas. Una **ruta absoluta** empieza desde la raíz del disco (`/Users/ana/proyecto/public/datasets/stores.csv`). Si compartes ese código, fallará porque nadie más tiene una carpeta llamada `ana`. Una **ruta relativa** parte desde la carpeta raíz del proyecto (`public/datasets/stores.csv`). Usar siempre rutas relativas permite que todo el equipo ejecute el mismo comando sin editar nada.',
      example: {
        language: 'bash',
        code: '# 1) Confirmar carpeta actual en la raíz del proyecto\npwd\n\n# 2) Listar tamaño de los archivos usando una ruta relativa\nls -lh public/datasets/stores.parquet public/datasets/events.parquet',
        expectedOutput: [
          {
            archivo: 'public/datasets/stores.parquet',
            filas_reales: 14,
            tamano_kb: 2.2,
            tipo_ruta: 'Relativa al proyecto (reproducible)'
          },
          {
            archivo: 'public/datasets/events.parquet',
            filas_reales: 65000,
            tamano_kb: 1074.0,
            tipo_ruta: 'Relativa al proyecto (reproducible)'
          }
        ]
      }
    },
    {
      id: 'inspeccionar-archivos-sin-saturar-la-memoria-ram',
      heading: 'Inspeccionar cabeceras y contar líneas antes de abrir un archivo',
      body: 'Abrir un archivo de texto desconocido a ciegas es un riesgo innecesario. Si el archivo tiene millones de filas, una interfaz gráfica intentará dibujarlo entero en la memoria RAM. Las utilidades estándar de terminal leen únicamente el fragmento que pides en milisegundos.\n\nEl comando `head -n 5 archivo.csv` imprime las primeras cinco líneas. Esto basta para ver los nombres de las columnas, el carácter separador y el formato de las fechas. Por su parte, `tail -n 5 archivo.csv` muestra las últimas cinco líneas para verificar que el archivo no quedó cortado a mitad de una descarga. Finalmente, `wc -l archivo.csv` cuenta cuántos saltos de línea contiene el archivo completo.',
      example: {
        language: 'bash',
        code: '# Inspeccionar la cabecera y las primeras 4 tiendas de Mercado Brisa\nhead -n 5 public/datasets/stores.csv\n\n# Contar líneas totales del archivo (1 cabecera + 14 registros = 15 líneas)\nwc -l public/datasets/stores.csv',
        expectedOutput: [
          {
            store_id: 1,
            store_code: 'STR-MX-01',
            store_name: 'Tienda Reforma Norte',
            store_type: 'flagship',
            city: 'Ciudad de México',
            monthly_target_usd: 85000
          },
          {
            store_id: 2,
            store_code: 'STR-MX-02',
            store_name: 'Tienda Polanco Sur',
            store_type: 'retail',
            city: 'Ciudad de México',
            monthly_target_usd: 64000
          },
          {
            store_id: 3,
            store_code: 'STR-MX-03',
            store_name: 'Tienda Chapultepec',
            store_type: 'retail',
            city: 'Guadalajara',
            monthly_target_usd: 52000
          },
          {
            store_id: 4,
            store_code: 'STR-CO-01',
            store_name: 'Tienda Chapinero Alto',
            store_type: 'flagship',
            city: 'Bogotá',
            monthly_target_usd: 71000
          }
        ]
      }
    },
    {
      id: 'filtrar-y-encadenar-procesos-con-tuberias-unix',
      heading: 'Conectar comandos pequeños con tuberías y filtrar con grep',
      body: 'Cada programa de terminal recibe datos por su entrada estándar (`stdin`) y escribe su resultado en la salida estándar (`stdout`). La **tubería Unix** (`|`) conecta la salida del comando izquierdo directamente con la entrada del comando derecho. Los datos fluyen en memoria línea por línea sin guardar archivos intermedios en el disco.\n\nSi combinas `grep` (que filtra líneas con un texto buscado) con `wc -l`, puedes auditar un archivo en segundos. Por ejemplo, `grep "flagship" public/datasets/stores.csv | wc -l` filtra las tiendas insignia de Mercado Brisa y cuenta exactamente 4 filas. Además, las variables de entorno (`export RUTA_DATOS="public/datasets"`) permiten parametrizar carpetas o credenciales fuera del código.',
      example: {
        language: 'bash',
        code: '# Filtrar únicamente las tiendas flagship de Mercado Brisa y contar cuántas son\ngrep "flagship" public/datasets/stores.csv | wc -l\n\n# Ver el detalle de los 3 almacenes logísticos (warehouse)\ngrep "warehouse" public/datasets/stores.csv',
        expectedOutput: [
          {
            store_id: 12,
            store_code: 'WH-MX-01',
            store_name: 'Almacén Central Vallejo',
            store_type: 'warehouse',
            city: 'Ciudad de México',
            monthly_target_usd: 95000
          },
          {
            store_id: 13,
            store_code: 'WH-CO-01',
            store_name: 'Almacén Logístico Sabana',
            store_type: 'warehouse',
            city: 'Bogotá',
            monthly_target_usd: 76000
          },
          {
            store_id: 14,
            store_code: 'WH-ES-01',
            store_name: 'Almacén Logístico Coslada',
            store_type: 'warehouse',
            city: 'Madrid',
            monthly_target_usd: 82000
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Auditoría rápida de tiendas físicas frente a almacenes en la terminal',
    description: 'Antes de cargar `stores.csv` en un reporte comercial de Mercado Brisa (empresa ficticia), dirección pregunta cuántas tiendas físicas de atención al público operan hoy. Compara el conteo bruto de líneas frente al filtrado con tuberías.',
    steps: [
      {
        label: 'Antipatrón: contar líneas brutas sin descontar cabecera ni almacenes',
        explanation: 'Ejecutar `wc -l` directamente sobre el archivo cuenta 15 líneas en total. Ese número suma la fila de nombres de columna y los 3 centros logísticos (`warehouse`), inflando el número de tiendas físicas.',
        code: '# ERROR: Asumir que cada línea del archivo CSV es una tienda física abierta al público\nwc -l public/datasets/stores.csv',
        expectedOutput: [
          {
            comando: 'wc -l public/datasets/stores.csv',
            lineas_contadas: 15,
            incluye_cabecera: 'Sí (+1 fila de nombres de columna)',
            incluye_almacenes: 'Sí (+3 filas WH-MX-01, WH-CO-01 y WH-ES-01)'
          }
        ]
      },
      {
        label: 'Solución verificada: omitir cabecera y excluir almacenes con tuberías',
        explanation: 'Con `tail -n +2` empezamos a leer desde la línea 2 (saltando la cabecera), con `grep -v "warehouse"` descartamos los 3 almacenes logísticos y con `wc -l` obtenemos las 11 tiendas físicas reales (7 `retail` y 4 `flagship`).',
        code: '# CORRECTO: Saltar la fila 1 de cabecera, excluir warehouse y contar tiendas físicas\ntail -n +2 public/datasets/stores.csv | grep -v "warehouse" | wc -l',
        expectedOutput: [
          {
            store_type: 'retail',
            stores_count: 7,
            target_usd: 370000,
            total_area_sqm: 2520
          },
          {
            store_type: 'flagship',
            stores_count: 4,
            target_usd: 302000,
            total_area_sqm: 2130
          },
          {
            store_type: 'warehouse (excluido por grep -v)',
            stores_count: 3,
            target_usd: 253000,
            total_area_sqm: 10800
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Un compañero guarda en el repositorio un script que carga `/Users/mateo/Desktop/brisa/public/datasets/stores.parquet`. Al ejecutarlo en tu portátil, falla de inmediato. ¿Por qué ocurrió y cómo se corrige?',
      options: [
        {
          id: 'a',
          text: 'Usó una ruta absoluta atada a su usuario local; debe cambiarse por la ruta relativa `public/datasets/stores.parquet` ejecutando desde la raíz del proyecto.',
          correct: true,
          feedback: 'Exacto. La ruta relativa parte de la carpeta raíz del proyecto y funciona igual en Windows, macOS, Linux y servidores de integración.'
        },
        {
          id: 'b',
          text: 'Los archivos `.parquet` solo pueden leerse si están guardados en el Escritorio de cada persona.',
          correct: false,
          feedback: 'El formato Parquet puede leerse desde cualquier carpeta; el fallo proviene de buscar el usuario `mateo` que no existe en tu disco.'
        },
        {
          id: 'c',
          text: 'La terminal no permite barras diagonales `/` en nombres de carpetas.',
          correct: false,
          feedback: 'El estándar POSIX utiliza `/` como separador de directorios; el problema es haber fijado la ruta desde la raíz del sistema de un usuario individual.'
        }
      ],
      explanation: 'Las rutas absolutas incluyen carpetas personales que no existen en otras máquinas. Las rutas relativas parten de la raíz del proyecto y garantizan que el código sea portable.'
    },
    {
      id: 'c2',
      type: 'predict-output',
      prompt: 'El archivo `stores.csv` de Mercado Brisa tiene 1 fila de cabecera y 14 filas de datos (4 `flagship`, 7 `retail` y 3 `warehouse`). ¿Qué número imprime el comando `wc -l public/datasets/stores.csv`?',
      options: [
        {
          id: 'a',
          text: '15, porque `wc -l` cuenta todas las líneas de texto del archivo, incluida la cabecera.',
          correct: true,
          feedback: 'Correcto. `wc -l` no sabe qué es un archivo CSV: cuenta saltos de línea físicos (1 cabecera + 14 filas = 15).'
        },
        {
          id: 'b',
          text: '14, porque `wc -l` descarta automáticamente la primera fila de nombres de columna.',
          correct: false,
          feedback: 'Incorrecto. Para omitir la cabecera antes de contar hay que combinar `tail -n +2 archivo.csv | wc -l`.'
        },
        {
          id: 'c',
          text: '11, porque excluye tanto la cabecera como los 3 almacenes logísticos.',
          correct: false,
          feedback: 'Incorrecto. `wc -l` no aplica ningún filtro sobre el contenido de las columnas.'
        }
      ],
      explanation: 'El comando `wc -l` cuenta líneas físicas de texto sin distinguir encabezados de registros. Para contar solo filas de datos debes saltar la primera línea con `tail -n +2`.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Qué hace exactamente el operador de tubería (`|`) en el comando `head -n 20 orders.csv | grep "cancelled"`?',
      options: [
        {
          id: 'a',
          text: 'Envía las 20 primeras líneas producidas por `head` directamente a la entrada de `grep` en memoria, sin crear ningún archivo intermedio.',
          correct: true,
          feedback: 'Correcto. La tubería conecta la salida estándar (`stdout`) del primer proceso con la entrada estándar (`stdin`) del segundo.'
        },
        {
          id: 'b',
          text: 'Borra del archivo `orders.csv` todas las filas posteriores a la línea 20.',
          correct: false,
          feedback: 'Ni `head` ni `grep` modifican el archivo original en disco; únicamente leen y filtran su flujo de texto.'
        },
        {
          id: 'c',
          text: 'Ejecuta `grep` primero sobre todo el archivo y guarda el resultado dentro de una carpeta llamada `head`.',
          correct: false,
          feedback: 'El flujo de una tubería corre de izquierda a derecha: primero `head` recorta 20 líneas y luego `grep` las filtra.'
        }
      ],
      explanation: 'La tubería (`|`) encadena programas pequeños pasando el flujo de texto de izquierda a derecha en memoria, sin modificar el archivo original ni llenar el disco con copias temporales.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Inspección y conteo de tiendas flagship con tuberías',
    language: 'bash',
    prompt: 'Completa la secuencia de comandos en la terminal para saltar la fila de cabecera de `public/datasets/stores.csv`, filtrar únicamente las tiendas de tipo `flagship` de Mercado Brisa y contar cuántas filas cumplen la condición.',
    starterCode: '# Saltar la primera línea (cabecera), filtrar tiendas flagship y contar líneas\n{{blank_1}} public/datasets/stores.csv | {{blank_2}} "flagship" | {{blank_3}}',
    expected: '# Saltar la primera línea (cabecera), filtrar tiendas flagship y contar líneas\ntail -n +2 public/datasets/stores.csv | grep "flagship" | wc -l',
    orderMatters: true,
    hints: [
      'Para imprimir un archivo empezando desde la línea 2 (omitiendo la cabecera de la línea 1), usa `tail -n +2`.',
      'Para quedarte únicamente con las líneas que contienen la palabra `"flagship"`, usa el filtro `grep`.',
      'Para contar el número de líneas que llegan al final de la tubería, usa `wc -l`.'
    ],
    solution: '# Saltar la primera línea (cabecera), filtrar tiendas flagship y contar líneas\ntail -n +2 public/datasets/stores.csv | grep "flagship" | wc -l',
    solutionExplanation: 'La tubería toma el archivo desde la segunda línea con `tail -n +2`, filtra las 4 tiendas insignia (`STR-MX-01`, `STR-CO-01`, `STR-CL-01` y `STR-ES-01`) con `grep "flagship"` y cuenta las 4 líneas resultantes con `wc -l`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Comando para leer desde la línea 2',
        correct: 'tail -n +2',
        options: ['tail -n +2', 'head -n 2', 'cd ..'],
        hint: '`tail -n +2` emite el archivo completo a partir de la segunda línea, descartando la fila 1 de nombres de columna.'
      },
      {
        id: 'blank_2',
        label: 'Comando para filtrar líneas por patrón',
        correct: 'grep',
        options: ['grep', 'pwd', 'ls -lh'],
        hint: '`grep` conserva solo las líneas que contienen la cadena buscada.'
      },
      {
        id: 'blank_3',
        label: 'Comando para contar líneas',
        correct: 'wc -l',
        options: ['wc -l', 'tail -n 1', 'mkdir'],
        hint: '`wc -l` cuenta cuántos saltos de línea llegan por la entrada estándar.'
      }
    ],
    expectedOutputTable: [
      {
        store_id: 1,
        store_code: 'STR-MX-01',
        store_name: 'Tienda Reforma Norte',
        country_code: 'MX',
        city: 'Ciudad de México',
        monthly_target_usd: 85000
      },
      {
        store_id: 4,
        store_code: 'STR-CO-01',
        store_name: 'Tienda Chapinero Alto',
        country_code: 'CO',
        city: 'Bogotá',
        monthly_target_usd: 71000
      },
      {
        store_id: 6,
        store_code: 'STR-CL-01',
        store_name: 'Tienda Providencia',
        country_code: 'CL',
        city: 'Santiago',
        monthly_target_usd: 68000
      },
      {
        store_id: 10,
        store_code: 'STR-ES-01',
        store_name: 'Tienda Salamanca',
        country_code: 'ES',
        city: 'Madrid',
        monthly_target_usd: 78000
      }
    ]
  },

  roleNotes: {
    de: 'Automatiza la validación previa de lotes recibidos con scripts que verifican el peso con `ls -lh`, la cabecera con `head -n 1` y el conteo de filas con `wc -l` antes de iniciar la carga.',
    da: 'Inspecciona con `head -n 5` y `grep` el separador de columnas, el formato de fechas y los valores raros de un CSV nuevo en segundos antes de escribir el código de lectura.',
    bi: 'Define rutas relativas o variables de entorno para las fuentes locales de los reportes, de modo que cualquier integrante del equipo pueda refrescar el modelo sin cambiar carpetas.'
  },

  summary: [
    'Usa siempre rutas relativas a la raíz del proyecto para que tus scripts funcionen en cualquier computadora.',
    'Inspecciona el peso y las primeras líneas con `ls -lh`, `head` y `tail` antes de abrir un archivo grande.',
    'Recuerda que `wc -l` cuenta todas las líneas físicas del archivo, incluida la fila de cabecera.',
    'La tubería (`|`) conecta la salida de un comando con la entrada del siguiente sin crear archivos intermedios.'
  ],

  flashcards: [
    {
      id: 'fc-c0-herr-01-a',
      front: '¿Por qué una ruta relativa (`public/datasets/stores.csv`) es preferible a una ruta absoluta (`/Users/ana/proyecto/...`) en un proyecto de datos?',
      back: 'Porque la ruta relativa parte de la carpeta del proyecto y funciona en el equipo de cualquier compañero o servidor sin depender del nombre de usuario local.'
    },
    {
      id: 'fc-c0-herr-01-b',
      front: '¿Cómo cuentas las filas de datos de un archivo CSV con cabecera usando `tail` y `wc`?',
      back: 'Con `tail -n +2 archivo.csv | wc -l`, que salta la primera línea de nombres de columna antes de contar los saltos de línea.'
    },
    {
      id: 'fc-c0-herr-01-c',
      front: '¿Qué diferencia hay entre la tubería `|` y la redirección `>` en la terminal?',
      back: 'La tubería `|` envía la salida como entrada a otro comando en memoria; `>` escribe la salida en un archivo en disco sobrescribiendo su contenido previo.'
    }
  ],

  glossaryTerms: [
    'ruta-relativa-absoluta',
    'tuberia-unix'
  ],

  sources: [
    {
      title: 'The Open Group Base Specifications Issue 8 (POSIX.1-2024) — Shell Command Language & Pipelines',
      url: 'https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html',
      publisher: 'IEEE / The Open Group',
      accessed: '2026-10-29',
      supports: 'Especificación estándar de flujos stdin/stdout, redirecciones, rutas y tuberías entre procesos.'
    },
    {
      title: 'Linux man-pages — wc(1) Word, Line, Character, and Byte Count',
      url: 'https://man7.org/linux/man-pages/man1/wc.1.html',
      publisher: 'Linux Kernel Organization / GNU Coreutils',
      accessed: '2026-10-29',
      supports: 'Funcionamiento del flag -l para contar saltos de línea en archivos de texto.'
    },
    {
      title: 'Linux man-pages — grep(1) Print Lines That Match Patterns',
      url: 'https://man7.org/linux/man-pages/man1/grep.1.html',
      publisher: 'Linux Kernel Organization / GNU Project',
      accessed: '2026-10-29',
      supports: 'Filtrado de líneas por coincidencia (`grep`) e inversión de filtro (`grep -v`).'
    },
    {
      title: 'The Unix Shell: Pipes and Filters',
      url: 'https://swcarpentry.github.io/shell-novice/04-pipefilter.html',
      publisher: 'The Carpentries',
      accessed: '2026-10-29',
      supports: 'Composición de comandos head, tail, grep y wc mediante tuberías para explorar datos tabulares.'
    }
  ],

  aiNotes: 'Las personas que empiezan suelen confundir `wc -l` con el número de registros sin descontar la cabecera, o temen que `grep` y `head` modifiquen el archivo original. Aclara que `head`, `tail`, `grep` y `wc` son operaciones de solo lectura y que solo la redirección `>` escribe en disco.'
};

export default lesson;
