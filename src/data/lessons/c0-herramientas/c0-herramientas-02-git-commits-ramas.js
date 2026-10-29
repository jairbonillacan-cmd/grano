const lesson = {
  id: 'c0-herramientas-02-git-commits-ramas',
  moduleId: 'c0-herramientas',
  tracks: ['core'],
  level: 0,
  order: 2,
  title: 'Git en 30 minutos: commits atómicos, ramas y diff',
  minutes: 25,
  prerequisites: ['c0-herramientas-01-terminal-rutas'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), tres personas editan el cálculo de metas mensuales de `stores` guardando copias llamadas `metas_v2.sql`, `metas_final_ana.sql` y `metas_ok_martes.sql`. El lunes el reporte ejecutivo suma 672 000 USD de las 11 tiendas físicas, pero el martes sube a 925 000 USD porque alguien sobrescribió el archivo e incluyó por accidente los 3 almacenes (`warehouse`). Nadie sabe qué línea cambió ni quién la tocó. ¿Cómo registras cada cambio con autor, fecha y comparación línea por línea sin duplicar archivos?',

  objectives: [
    'Diferenciar el directorio de trabajo, el área de preparación (`git add`) y el historial confirmado (`git commit`).',
    'Inspeccionar cambios línea por línea con `git status` y `git diff` antes de crear un commit atómico.',
    'Aislar el trabajo en una rama con `git switch -c` y proteger secretos y datos pesados mediante `.gitignore`.'
  ],

  sections: [
    {
      id: 'tres-estados-de-git-y-exclusiones-en-gitignore',
      heading: 'Los tres estados de Git y qué nunca debes subir al repositorio',
      body: 'Git no guarda copias sueltas con sufijos como `_final_v3`: registra instantáneas completas de tu proyecto a lo largo del tiempo. Para controlar qué entra en cada instantánea, Git maneja tres zonas. Primero está tu directorio de trabajo, donde editas los archivos. Segundo está el **área de preparación** (*staging area*), donde eliges con `git add` qué cambios concretos quieres empaquetar. Tercero está el repositorio local, donde `git commit` sella esa selección con un identificador único.\n\nNo todo lo que vive en tu carpeta debe entrar a Git. El archivo `.gitignore` lista las rutas que Git debe ignorar siempre: contraseñas en archivos `.env`, entornos de paquetes (`.venv/`) y archivos de datos pesados (`*.parquet`, `*.csv`).En Git se versiona el código que transforma los datos, nunca las credenciales ni gigabytes de tablas crudas.',
      example: {
        language: 'bash',
        code: '# Configuración mínima de .gitignore en un proyecto de datos\ncat .gitignore\n# .env\n# .venv/\n# *.parquet\n\n# Ver qué archivos cambiaron respecto al último commit\ngit status -s',
        expectedOutput: [
          {
            estado_git: 'M consultas/metas_tiendas.sql',
            zona_actual: 'Directorio de trabajo (modificado, aún sin git add)',
            accion_gitignore: 'Rastreado (código SQL limpio)'
          },
          {
            estado_git: '?? .env (ignorado)',
            zona_actual: 'Excluido por .gitignore',
            accion_gitignore: 'Bloqueado (protege credenciales locales)'
          },
          {
            estado_git: '?? public/datasets/orders.parquet (ignorado)',
            zona_actual: 'Excluido por .gitignore',
            accion_gitignore: 'Bloqueado (384.1 KB de datos binarios)'
          }
        ]
      }
    },
    {
      id: 'commits-atomicos-e-inspeccion-con-git-diff',
      heading: 'Inspeccionar diferencias con git diff y crear commits atómicos',
      body: 'Antes de confirmar cualquier cambio, ejecuta `git diff`. Este comando muestra exactamente qué líneas borraste (precedidas por un signo `-`) y qué líneas agregaste (precedidas por un signo `+`). Revisar el `diff` evita subir filtros de prueba olvidados o columnas mal escritas.\n\nUna vez verificado el cambio, regístralo como un **commit atómico**: una unidad que resuelve un solo problema y deja el proyecto funcionando. Si hoy corriges la exclusión de los 3 almacenes (`WH-MX-01`, `WH-CO-01`, `WH-ES-01`) y además creas un reporte de festivos de `calendar`, haz dos commits separados. Así, si mañana hay que revertir uno de los dos cambios, puedes deshacerlo sin perder el otro.',
      example: {
        language: 'bash',
        code: '# Revisar línea por línea el cambio antes de prepararlo\ngit diff consultas/metas_tiendas.sql\n\n# --- a/consultas/metas_tiendas.sql\n# +++ b/consultas/metas_tiendas.sql\n# @@ -3,3 +3,4 @@\n#  SELECT region, COUNT(*) AS physical_stores, SUM(monthly_target_usd) AS target_usd\n#  FROM stores\n# +WHERE store_type <> \'warehouse\'\n#  GROUP BY region;',
        expectedOutput: [
          {
            region: 'Norteamérica',
            physical_stores: 3,
            retail_flagship_target_usd: 201000
          },
          {
            region: 'Cono Sur',
            physical_stores: 3,
            retail_flagship_target_usd: 168000
          },
          {
            region: 'Andina',
            physical_stores: 3,
            retail_flagship_target_usd: 164000
          },
          {
            region: 'Iberia',
            physical_stores: 2,
            retail_flagship_target_usd: 139000
          }
        ]
      }
    },
    {
      id: 'ramas-aisladas-con-git-switch-y-pull-requests',
      heading: 'Trabajar en ramas aisladas y revisar cambios antes de fusionar',
      body: 'La rama principal del proyecto suele llamarse `main` y representa la versión verificada en la que confía todo el equipo. Si editas directamente sobre `main` mientras pruebas una idea a medias, puedes romper las consultas de tus compañeros.\n\nPara trabajar sin riesgo, crea una rama nueva con `git switch -c fix/excluir-almacenes`. Una rama es simplemente un puntero ligero a tu línea de commits. Ahí haces tus pruebas, verificas los totales contra Mercado Brisa y confirmas tu commit. Cuando terminas, abres una solicitud de integración (*Pull Request*): otro integrante del equipo lee tu `diff`, comprueba que la suma de las 11 tiendas físicas cuadra en 672 000 USD y aprueba la fusión (`git merge`) hacia `main`.',
      example: {
        language: 'bash',
        code: '# 1) Crear una rama aislada para el arreglo\ngit switch -c fix/excluir-almacenes\n\n# 2) Pasar el archivo verificado al área de preparación y confirmar el commit\ngit add consultas/metas_tiendas.sql\ngit commit -m "Excluye los 3 almacenes WH de la meta comercial por región"',
        expectedOutput: [
          {
            rama: 'fix/excluir-almacenes',
            archivos_cambiados: 1,
            inserciones: '+1 (WHERE store_type <> \'warehouse\')',
            meta_total_verificada_usd: 672000
          }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Cómo git diff evita publicar un filtro de prueba en el reporte regional',
    description: 'Al corregir la consulta de metas regionales sobre `stores.parquet` de Mercado Brisa, una analista agregó un filtro temporal `WHERE region = \'Iberia\'` para probar rápido y olvidó quitarlo. Observa cómo cambia el resultado entre hacer un commit a ciegas y auditar con `git diff`.',
    steps: [
      {
        label: 'Antipatrón: git add . a ciegas arrastrando un filtro temporal de prueba',
        explanation: 'Ejecutar `git add .` sin mirar `git diff` incluye en el commit la línea de prueba `AND region = \'Iberia\'`, dejando fuera 9 de las 11 tiendas físicas de Mercado Brisa.',
        code: '# ERROR: Empaquetar todos los archivos sin revisar qué líneas exactas cambiaron\ngit add .\ngit commit -m "cambios viernes"',
        expectedOutput: [
          {
            region: 'Iberia',
            stores_count: 2,
            retail_flagship_target_usd: 139000,
            estado_auditoria: 'Incompleto: faltan Norteamérica, Cono Sur y Andina'
          }
        ]
      },
      {
        label: 'Solución verificada: inspeccionar git diff y registrar un commit atómico',
        explanation: 'Al correr `git diff`, la línea `+ AND region = \'Iberia\'` salta a la vista de inmediato. Se elimina ese filtro temporal, se prepara el archivo con `git add` y se confirma un commit atómico con las 4 regiones completas.',
        code: '# CORRECTO: Inspeccionar diferencias, limpiar el filtro de prueba y hacer commit con mensaje claro\ngit diff consultas/metas_tiendas.sql\ngit add consultas/metas_tiendas.sql\ngit commit -m "Filtra store_type distinto de warehouse en metas regionales"',
        expectedOutput: [
          {
            region: 'Norteamérica',
            stores_count: 4,
            physical_stores: 3,
            region_target_usd: 296000,
            retail_flagship_target_usd: 201000
          },
          {
            region: 'Andina',
            stores_count: 4,
            physical_stores: 3,
            region_target_usd: 240000,
            retail_flagship_target_usd: 164000
          },
          {
            region: 'Iberia',
            stores_count: 3,
            physical_stores: 2,
            region_target_usd: 221000,
            retail_flagship_target_usd: 139000
          },
          {
            region: 'Cono Sur',
            stores_count: 3,
            physical_stores: 3,
            region_target_usd: 168000,
            retail_flagship_target_usd: 168000
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: 'Modificaste dos archivos hoy: `metas_tiendas.sql` (arreglo urgente ya verificado) y `experimento_borrador.py` (incompleto, con errores). ¿Cómo registras únicamente el arreglo urgente en el historial de Git?',
      options: [
        {
          id: 'a',
          text: 'Ejecutas `git add metas_tiendas.sql` para subir solo ese archivo al área de preparación y luego `git commit -m "..."`.',
          correct: true,
          feedback: 'Exacto. El área de preparación te permite elegir archivo por archivo qué entra en el próximo commit sin arrastrar borradores.'
        },
        {
          id: 'b',
          text: 'Ejecutas `git add .` porque Git descarta automáticamente los archivos que contienen errores.',
          correct: false,
          feedback: 'Incorrecto. `git add .` agrega todos los archivos modificados de la carpeta sin evaluar si el código funciona o está a medias.'
        },
        {
          id: 'c',
          text: 'Borras `experimento_borrador.py` de tu disco duro, haces el commit y luego lo vuelves a escribir desde cero.',
          correct: false,
          feedback: 'Incorrecto. No necesitas borrar tu trabajo en curso; basta con no incluirlo en `git add`.'
        }
      ],
      explanation: 'El área de preparación (*staging area*) separa lo que estás editando de lo que vas a confirmar, permitiéndote construir commits atómicos aunque tengas otros archivos en curso.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: '¿Por qué los archivos `.env` con claves de bases de datos y los archivos `.parquet` de varios cientos de megabytes deben incluirse en `.gitignore`?',
      options: [
        {
          id: 'a',
          text: 'Porque subir `.env` expone credenciales privadas en el historial y subir binarios pesados infla el repositorio volviendo lentas las clonaciones.',
          correct: true,
          feedback: 'Correcto. Las credenciales nunca van al repositorio y los archivos de datos grandes se gestionan en almacenamiento de objetos o carpetas locales ignoradas.'
        },
        {
          id: 'b',
          text: 'Porque Git solo acepta archivos cuyo nombre termine en `.sql` o `.py`.',
          correct: false,
          feedback: 'Git puede rastrear cualquier tipo de archivo, pero está diseñado para código fuente y texto, no para secretos ni almacenes de datos.'
        },
        {
          id: 'c',
          text: 'Porque `.gitignore` comprime automáticamente los archivos `.parquet` para que ocupen menos espacio en RAM.',
          correct: false,
          feedback: '`.gitignore` no comprime archivos; simplemente le indica a Git que no los rastree ni los proponga en `git status`.'
        }
      ],
      explanation: 'Si una contraseña entra en un commit, queda grabada en el historial aunque borres el archivo después. `.gitignore` evita que secretos y datos masivos se suban por accidente.'
    },
    {
      id: 'c3',
      type: 'predict-output',
      prompt: 'Editaste `consultas/metas_tiendas.sql`, pero todavía NO has ejecutado `git add`. ¿Qué comando te muestra las líneas exactas que acabas de cambiar en tu directorio de trabajo?',
      options: [
        {
          id: 'a',
          text: '`git diff`',
          correct: true,
          feedback: 'Correcto. `git diff` sin argumentos compara tu directorio de trabajo actual contra el área de preparación.'
        },
        {
          id: 'b',
          text: '`git status`',
          correct: false,
          feedback: '`git status` lista qué archivos fueron modificados, pero no muestra las líneas internas que cambiaron.'
        },
        {
          id: 'c',
          text: '`git switch -c`',
          correct: false,
          feedback: '`git switch -c` crea y activa una nueva rama; no inspecciona diferencias de contenido.'
        }
      ],
      explanation: 'Mientras los cambios están en el directorio de trabajo, `git diff` muestra las líneas añadidas y eliminadas; una vez ejecutado `git add`, se revisan con `git diff --staged`.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Flujo de rama, inspección de diff y commit atómico',
    language: 'bash',
    prompt: 'Completa los comandos de Git para crear una rama aislada llamada `fix/metas-sin-almacenes`, inspeccionar las líneas modificadas en `consultas/metas_tiendas.sql`, preparar únicamente ese archivo y registrar un commit atómico.',
    starterCode: '# 1. Crear y cambiar a la rama aislada\ngit {{blank_1}} fix/metas-sin-almacenes\n\n# 2. Revisar línea por línea qué cambió antes de preparar el archivo\ngit {{blank_2}} consultas/metas_tiendas.sql\n\n# 3. Subir solo el archivo verificado al área de preparación y confirmar\ngit add consultas/metas_tiendas.sql\ngit {{blank_3}} "Excluye almacenes WH del cálculo de metas por región"',
    expected: '# 1. Crear y cambiar a la rama aislada\ngit switch -c fix/metas-sin-almacenes\n\n# 2. Revisar línea por línea qué cambió antes de preparar el archivo\ngit diff consultas/metas_tiendas.sql\n\n# 3. Subir solo el archivo verificado al área de preparación y confirmar\ngit add consultas/metas_tiendas.sql\ngit commit -m "Excluye almacenes WH del cálculo de metas por región"',
    orderMatters: true,
    hints: [
      'Para crear una rama nueva y moverte a ella en un solo paso, usa `switch -c`.',
      'Para comparar las líneas añadidas (`+`) y borradas (`-`) en el archivo antes de hacer `git add`, usa `diff`.',
      'Para sellar el commit con un mensaje descriptivo en línea, usa `commit -m`.'
    ],
    solution: '# 1. Crear y cambiar a la rama aislada\ngit switch -c fix/metas-sin-almacenes\n\n# 2. Revisar línea por línea qué cambió antes de preparar el archivo\ngit diff consultas/metas_tiendas.sql\n\n# 3. Subir solo el archivo verificado al área de preparación y confirmar\ngit add consultas/metas_tiendas.sql\ngit commit -m "Excluye almacenes WH del cálculo de metas por región"',
    solutionExplanation: 'El flujo aísla primero el trabajo con `git switch -c`, verifica las líneas exactas con `git diff`, selecciona el archivo con `git add` y registra la instantánea con `git commit -m`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Subcomando para crear y activar rama',
        correct: 'switch -c',
        options: ['switch -c', 'merge', 'status -s'],
        hint: '`git switch -c <nombre>` crea una rama nueva a partir del commit actual y cambia a ella.'
      },
      {
        id: 'blank_2',
        label: 'Subcomando para ver líneas modificadas',
        correct: 'diff',
        options: ['diff', 'init', 'clone'],
        hint: '`git diff` muestra las líneas exactas añadidas y eliminadas en el directorio de trabajo.'
      },
      {
        id: 'blank_3',
        label: 'Subcomando para guardar el commit con mensaje',
        correct: 'commit -m',
        options: ['commit -m', 'add .', 'push --force'],
        hint: '`git commit -m "mensaje"` confirma los cambios del área de preparación en el historial.'
      }
    ],
    expectedOutputTable: [
      {
        region: 'Norteamérica',
        physical_stores: 3,
        retail_flagship_target_usd: 201000
      },
      {
        region: 'Cono Sur',
        physical_stores: 3,
        retail_flagship_target_usd: 168000
      },
      {
        region: 'Andina',
        physical_stores: 3,
        retail_flagship_target_usd: 164000
      },
      {
        region: 'Iberia',
        physical_stores: 2,
        retail_flagship_target_usd: 139000
      }
    ]
  },

  roleNotes: {
    de: 'Versiona definiciones de tablas, contratos de datos y DAGs en ramas cortas; exige que cada Pull Request pase pruebas automáticas antes de fusionarse a `main`.',
    da: 'Guarda cada consulta de un estudio en Git con commits atómicos que expliquen por qué se aplicó cada filtro (como excluir los 3 almacenes `warehouse` o el SKU de prueba).',
    bi: 'Almacena las definiciones de métricas y modelos semánticos en archivos de texto dentro de Git para revisar con `git diff` cualquier cambio en una fórmula de negocio.'
  },

  summary: [
    'Git separa tu trabajo en tres zonas: directorio de trabajo, área de preparación (`git add`) y repositorio (`git commit`).',
    'Configura `.gitignore` desde el primer día para excluir archivos `.env`, entornos `.venv/` y datos pesados.',
    'Revisa siempre `git diff` antes de confirmar para no subir filtros de prueba ni cambios accidentales.',
    'Trabaja en ramas aisladas con `git switch -c` y haz commits atómicos que resuelvan una sola tarea.'
  ],

  flashcards: [
    {
      id: 'fc-c0-herr-02-a',
      front: '¿Cuáles son las tres zonas por las que pasa un cambio en Git antes de quedar en el historial local?',
      back: '1) Directorio de trabajo (edición), 2) Área de preparación o staging area (`git add`) y 3) Repositorio local (`git commit`).'
    },
    {
      id: 'fc-c0-herr-02-b',
      front: '¿Qué es un commit atómico y por qué facilita revertir errores en un equipo de datos?',
      back: 'Es un commit que contiene un único cambio lógico completo y funcional; si falla o cambia el criterio, se puede revertir sin deshacer otros arreglos.'
    },
    {
      id: 'fc-c0-herr-02-c',
      front: '¿Qué diferencia hay entre `git diff` y `git diff --staged`?',
      back: '`git diff` muestra los cambios aún no agregados con `git add`; `git diff --staged` muestra exactamente lo que entrará en el próximo `git commit`.'
    }
  ],

  glossaryTerms: [
    'commit-atomico',
    'area-preparacion-git'
  ],

  sources: [
    {
      title: 'Pro Git Book (2nd Edition) — Chapter 2.2: Recording Changes to the Repository',
      url: 'https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository',
      publisher: 'Git Project (Scott Chacon & Ben Straub)',
      accessed: '2026-10-29',
      supports: 'Ciclo de estados de los archivos, uso de git status, git add, git commit y reglas de .gitignore.'
    },
    {
      title: 'Pro Git Book (2nd Edition) — Chapter 3.1: Branches in a Nutshell',
      url: 'https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell',
      publisher: 'Git Project (Scott Chacon & Ben Straub)',
      accessed: '2026-10-29',
      supports: 'Modelo interno de ramas como punteros a commits y aislamiento del trabajo con git switch.'
    },
    {
      title: 'Git Official Reference Manual — git-diff Documentation',
      url: 'https://git-scm.com/docs/git-diff',
      publisher: 'Git Project',
      accessed: '2026-10-29',
      supports: 'Comparación de líneas entre el directorio de trabajo, el índice (staging) y commits previos.'
    },
    {
      title: 'GitHub Docs — About Pull Requests',
      url: 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests',
      publisher: 'GitHub / Microsoft',
      accessed: '2026-10-29',
      supports: 'Revisión de diferencias por pares antes de fusionar una rama de trabajo en la rama principal.'
    }
  ],

  aiNotes: 'Quienes empiezan suelen usar `git add .` mecánicamente y temen crear ramas pensando que duplican toda la carpeta en el disco. Explica que una rama en Git es solo un puntero de 41 bytes y recomienda ejecutar siempre `git status` y `git diff` antes de `git add`.'
};

export default lesson;
