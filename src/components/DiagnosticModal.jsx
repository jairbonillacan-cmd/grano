import React, { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, CheckCircle2 } from 'lucide-react';
import {
  AnswerOption,
  Button,
  Callout,
  Chip,
  ProgressBar,
  Segmented,
} from './ui/index.js';
import { TRACKS } from '../data/catalog/tracks.js';
import { LEVELS } from '../data/catalog/levels.js';
import { getTrackPath } from '../data/catalog/modules.js';
import { LESSONS_BY_ID } from '../data/lessons/index.js';
import {
  completeOnboarding,
  markLessonKnown,
  setDiagnosticResult,
  setStartLevel,
  setTrack,
  useProfile,
} from '../state/store.js';
import '../styles/views/onboarding.css';

export const MANUAL_TRACK_OPTIONS = [
  {
    id: 'de',
    label: 'Ingeniería de Datos (DE)',
    recommendedStage: 'Nivel 0: Cimientos',
    recommendedStageId: 'stage-1',
    recommendedLessonId: 'l1-joins-fanout',
    focusRole: 'DE',
    description:
      'Tuberías incrementales, formatos abiertos Parquet e Iceberg, contratos de datos y procesamiento en tiempo real.',
  },
  {
    id: 'da',
    label: 'Análisis de Datos (DA)',
    recommendedStage: 'Nivel 0: Cimientos',
    recommendedStageId: 'stage-1',
    recommendedLessonId: 'l1-joins-fanout',
    focusRole: 'DA',
    description:
      'Inferencia estadística, exploración estructurada, retención por cohortes, pruebas A/B con CUPED y causalidad.',
  },
  {
    id: 'bi',
    label: 'Business Intelligence (BI)',
    recommendedStage: 'Nivel 0: Cimientos',
    recommendedStageId: 'stage-1',
    recommendedLessonId: 'l1-joins-fanout',
    focusRole: 'BI',
    description:
      'Diseño de indicadores, árboles de KPIs, modelo semántico en estrella, medidas DAX, tableros y gobierno RLS.',
  },
];

// 7 preguntas del tronco común (niveles 0 a 2) en orden de dificultad creciente
const CORE_QUESTIONS = [
  {
    slot: 1,
    level: 0,
    track: 'core',
    topic: 'Tipos de dato y valores nulos',
    question:
      'En la tabla orders de Mercado Brisa (empresa ficticia), tres pedidos tienen en discount_amount los valores 0, 15.50 y NULL. ¿Qué devuelve AVG(discount_amount) en SQL estándar y por qué?',
    codeSnippet: `SELECT AVG(discount_amount) AS avg_discount
FROM orders
WHERE order_id IN (101, 102, 103);
-- Filas: 0.00, 15.50, NULL`,
    options: [
      {
        id: 'a',
        text: 'Devuelve 7.75, porque AVG ignora los valores NULL y divide entre 2 filas, no entre 3. Si NULL significa "sin descuento", hay que aplicar COALESCE(discount_amount, 0).',
        correct: true,
        explanation:
          'Las funciones agregadas en SQL salvo COUNT(*) omiten los valores NULL tanto en el numerador como en el denominador.',
      },
      {
        id: 'b',
        text: 'Devuelve 5.17, porque SQL convierte automáticamente cualquier NULL en cero antes de calcular un promedio.',
        correct: false,
        explanation:
          'SQL nunca sustituye NULL por cero de forma implícita; asumirlo infla los promedios cuando los nulos representan ausencia de importe.',
      },
      {
        id: 'c',
        text: 'Devuelve NULL, porque un solo valor desconocido anula toda función de agregación sobre la columna.',
        correct: false,
        explanation:
          'Las expresiones aritméticas fila a fila (como price - discount_amount) sí devuelven NULL, pero AVG() ignora las filas nulas.',
      },
    ],
  },
  {
    slot: 2,
    level: 0,
    track: 'core',
    topic: 'Medidas descriptivas y asimetría',
    question:
      'En Mercado Brisa (empresa ficticia), el 95 % de los pedidos se entrega en unos 35 minutos, pero un 5 % sufre incidencias de tráfico y supera los 220 minutos. ¿Qué indicadores resumen con honestidad el tiempo de entrega habitual y su variabilidad?',
    options: [
      {
        id: 'a',
        text: 'La mediana (percentil 50) junto con el rango intercuartílico o el percentil 90 (p90), porque la media aritmética se desplaza hacia los casos extremos.',
        correct: true,
        explanation:
          'En distribuciones con cola derecha larga (importes, tiempos de espera), la mediana representa el caso típico y el p90 mide la cola operativa.',
      },
      {
        id: 'b',
        text: 'Únicamente la media aritmética simple, ya que siempre coincide con el percentil 50 aunque existan valores extremos.',
        correct: false,
        explanation:
          'La media y la mediana solo coinciden en distribuciones simétricas; la cola de 220 minutos arrastra la media muy por encima del pedido típico.',
      },
      {
        id: 'c',
        text: 'Borrar de la base de datos todos los pedidos que tarden más de 60 minutos antes de calcular cualquier indicador.',
        correct: false,
        explanation:
          'Ocultar retrasos reales de clientes distorsiona el nivel de servicio; se reportan con percentiles como p90 y p99.',
      },
    ],
  },
  {
    slot: 3,
    level: 1,
    track: 'core',
    topic: 'Orden lógico de SQL: WHERE frente a HAVING',
    question:
      'Quieres listar las categorías de products en Mercado Brisa que tienen más de 20 productos activos (is_active = true). ¿En qué cláusula debe ir cada condición?',
    codeSnippet: `SELECT category, COUNT(*) AS active_products
FROM products
WHERE is_active = true
GROUP BY category
HAVING COUNT(*) > 20;`,
    options: [
      {
        id: 'a',
        text: 'WHERE is_active = true filtra las filas individuales antes de agrupar, y HAVING COUNT(*) > 20 filtra los grupos ya calculados por GROUP BY.',
        correct: true,
        explanation:
          'El motor evalúa FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY; las funciones agregadas aún no existen durante WHERE.',
      },
      {
        id: 'b',
        text: 'Ambas condiciones van dentro de WHERE separadas por AND, porque WHERE se ejecuta después de GROUP BY.',
        correct: false,
        explanation:
          'Escribir COUNT(*) dentro de WHERE produce un error de sintaxis porque WHERE actúa sobre filas previas a la agregación.',
      },
      {
        id: 'c',
        text: 'Ambas condiciones deben ir en HAVING sin usar WHERE, para que el motor agrupe primero todos los productos inactivos.',
        correct: false,
        explanation:
          'Filtrar is_active en WHERE descarta filas antes de agrupar y evita mezclar productos inactivos en el conteo de cada categoría.',
      },
    ],
  },
  {
    slot: 4,
    level: 1,
    track: 'core',
    topic: 'Grano de una tabla y fan-out en JOINs',
    question:
      'La tabla orders tiene 1 fila por pedido con la columna shipping_fee. La tabla order_items tiene hasta 6 filas por pedido (una por artículo). Si unes ambas con LEFT JOIN y calculas SUM(orders.shipping_fee), ¿qué ocurre?',
    codeSnippet: `SELECT o.store_id, SUM(o.shipping_fee) AS total_shipping
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.store_id;`,
    options: [
      {
        id: 'a',
        text: 'Se produce un fan-out: el costo de envío de cada pedido se multiplica por la cantidad de artículos que tenga ese pedido, inflando el total.',
        correct: true,
        explanation:
          'Al unir relación 1:N, cada fila del lado 1 se repite N veces. Para conservar el grano de pedido hay que pre-agregar order_items por order_id antes de unir.',
      },
      {
        id: 'b',
        text: 'El motor SQL detecta que shipping_fee pertenece a orders y lo suma una sola vez por order_id de forma automática.',
        correct: false,
        explanation:
          'SUM() opera sobre las filas resultantes del JOIN sin recordar de qué tabla provenía cada columna.',
      },
      {
        id: 'c',
        text: 'El LEFT JOIN descarta los pedidos con más de un artículo y devuelve un importe inferior al real.',
        correct: false,
        explanation:
          'Un LEFT JOIN preserva todas las filas de la izquierda y genera tantas filas como coincidencias haya en la tabla derecha.',
      },
    ],
  },
  {
    slot: 5,
    level: 1,
    track: 'core',
    topic: 'Integridad referencial y ANTI JOIN',
    question:
      'Durante una auditoría de calidad en Mercado Brisa quieres encontrar todas las líneas de order_items cuyo order_id no exista en la tabla orders (registros huérfanos). ¿Qué patrón SQL es seguro incluso si hay valores NULL?',
    options: [
      {
        id: 'a',
        text: 'Usar WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.order_id = oi.order_id) o un LEFT JOIN filtrando WHERE o.order_id IS NULL.',
        correct: true,
        explanation:
          'NOT EXISTS y LEFT JOIN ... IS NULL implementan un ANTI JOIN seguro frente a la lógica de tres valores de NULL, a diferencia de NOT IN.',
      },
      {
        id: 'b',
        text: 'Usar un INNER JOIN entre orders y order_items, ya que devuelve únicamente las filas que no tienen correspondencia.',
        correct: false,
        explanation:
          'INNER JOIN devuelve solo las filas que sí cruzan en ambas tablas, ocultando precisamente los registros huérfanos.',
      },
      {
        id: 'c',
        text: 'Comparar COUNT(*) de ambas tablas; si order_items tiene más filas que orders, entonces hay registros huérfanos.',
        correct: false,
        explanation:
          'Como un pedido válido puede tener varios artículos, es normal que order_items tenga muchas más filas que orders sin que exista ningún huérfano.',
      },
    ],
  },
  {
    slot: 6,
    level: 2,
    track: 'core',
    topic: 'Funciones de ventana y QUALIFY',
    question:
      'Necesitas obtener la fila completa del pedido más reciente de cada cliente en orders, desempatando por order_id descendente, sin agrupar ni perder las columnas del pedido. ¿Cómo se resuelve?',
    codeSnippet: `SELECT customer_id, order_id, created_at, net_amount
FROM orders
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY customer_id
  ORDER BY created_at DESC, order_id DESC
) = 1;`,
    options: [
      {
        id: 'a',
        text: 'Particionando por customer_id con ROW_NUMBER() ordenado por created_at DESC, order_id DESC y filtrando la posición 1 con QUALIFY o una CTE.',
        correct: true,
        explanation:
          'ROW_NUMBER() asigna un entero único por partición conservando todas las columnas de la fila original.',
      },
      {
        id: 'b',
        text: 'Usando GROUP BY customer_id y seleccionando directamente order_id y net_amount sin función de agregación.',
        correct: false,
        explanation:
          'Seleccionar columnas fuera del GROUP BY sin agregarlas es inválido en SQL estándar o devuelve valores arbitrarios que no corresponden al último pedido.',
      },
      {
        id: 'c',
        text: 'Aplicando LAG(net_amount) sin PARTITION BY ni ORDER BY para quedarse únicamente con la primera fila de la tabla.',
        correct: false,
        explanation:
          'LAG accede al valor de una fila previa dentro de una ventana, pero no filtra el último registro de cada cliente.',
      },
    ],
  },
  {
    slot: 7,
    level: 2,
    track: 'core',
    topic: 'Modelado dimensional: SCD tipo 2',
    question:
      'En el almacén dimensional de Mercado Brisa, una tienda cambia de formato "Express" a "Supermercado" el 1 de julio. El equipo comercial necesita que las ventas de enero a junio sigan reportándose bajo "Express" y las de julio en adelante bajo "Supermercado". ¿Cómo modelas dim_store?',
    options: [
      {
        id: 'a',
        text: 'Como una dimensión lentamente cambiante tipo 2 (SCD tipo 2) con clave subrogada (store_sk) y fechas de vigencia (valid_from, valid_to) por versión.',
        correct: true,
        explanation:
          'SCD tipo 2 crea una nueva fila con nueva clave subrogada ante cada cambio de atributo, preservando la asignación histórica exacta en la tabla de hechos.',
      },
      {
        id: 'b',
        text: 'Actualizando el atributo store_format con UPDATE sobre la misma fila (SCD tipo 1) para mantener una sola fila por tienda.',
        correct: false,
        explanation:
          'SCD tipo 1 sobrescribe el pasado: todas las ventas de enero a junio pasarían a figurar como "Supermercado".',
      },
      {
        id: 'c',
        text: 'Eliminando los pedidos anteriores al 1 de julio para evitar que coexistan dos formatos de tienda.',
        correct: false,
        explanation:
          'Borrar hechos históricos destruye la serie temporal de ingresos y el análisis interanual.',
      },
    ],
  },
];

// 3 preguntas específicas por área (niveles 2 y 3)
const AREA_QUESTIONS = {
  de: [
    {
      slot: 8,
      level: 2,
      track: 'de',
      topic: 'Almacenamiento columnar en Parquet y zone maps',
      question:
        'Una consulta en DuckDB suma únicamente dos columnas (net_amount y tax_amount) sobre un archivo Parquet de 80 millones de filas y 70 columnas filtrado por order_date >= DATE \'2025-09-01\'. ¿Por qué lee muchos menos bytes del disco que sobre un CSV?',
      options: [
        {
          id: 'a',
          text: 'Porque Parquet lee solo los fragmentos de las columnas proyectadas (poda de columnas) y usa las estadísticas min/max por grupo de filas (zone maps) para saltar bloques que no cumplen el filtro.',
          correct: true,
          explanation:
            'La disposición columnar evita leer las 67 columnas restantes y los metadatos de cada Row Group permiten omitir bloques enteros sin descomprimirlos.',
        },
        {
          id: 'b',
          text: 'Porque Parquet descomprime las 70 columnas en memoria RAM al abrir el archivo y aplica un índice de texto completo.',
          correct: false,
          explanation:
            'El beneficio principal de Parquet es precisamente no leer ni descomprimir las columnas que no intervienen en la consulta.',
        },
        {
          id: 'c',
          text: 'Porque Parquet guarda los números como texto plano sin esquema y delega la conversión a la tarjeta gráfica.',
          correct: false,
          explanation:
            'Parquet almacena datos binarios tipados y comprimidos (diccionario, RLE, Zstandard) con su esquema en el pie del archivo.',
        },
      ],
    },
    {
      slot: 9,
      level: 3,
      track: 'de',
      topic: 'Pipelines incrementales e idempotencia',
      question:
        'Tu pipeline horario carga los pedidos de la última hora en fct_orders. Si el orquestador reejecuta tres veces la ventana de las 10:00 tras un corte de red, ¿qué diseño garantiza que el conteo y los importes en fct_orders no se tripliquen?',
      options: [
        {
          id: 'a',
          text: 'Diseñar una escritura idempotente: usar MERGE por order_id o reemplazar atómicamente la partición/ventana temporal acotada del lote.',
          correct: true,
          explanation:
            'Una tarea es idempotente cuando aplicarla una o varias veces sobre la misma entrada deja la tabla destino exactamente en el mismo estado.',
        },
        {
          id: 'b',
          text: 'Hacer INSERT INTO directo sin clave y pedir a todos los analistas que añadan SELECT DISTINCT en cada consulta de sus reportes.',
          correct: false,
          explanation:
            'Trasladar la deduplicación al consumo encarece cada lectura y falla en cuanto alguien olvida el DISTINCT.',
        },
        {
          id: 'c',
          text: 'Desactivar los reintentos automáticos en el orquestador y dejar huecos sin datos cada vez que falle la red.',
          correct: false,
          explanation:
            'Los fallos transitorios de red son inevitables; el pipeline debe tolerar reintentos automáticos y backfills sin corromper los datos.',
        },
      ],
    },
    {
      slot: 10,
      level: 3,
      track: 'de',
      topic: 'Tablas abiertas Apache Iceberg y evolución de partición',
      question:
        'En una tabla Apache Iceberg de 25 TB necesitas cambiar el particionado de mensual a diario y borrar los registros de un cliente por normativa de privacidad sin bloquear a los lectores concurrentes ni reescribir meses históricos. ¿Qué lo permite?',
      options: [
        {
          id: 'a',
          text: 'El particionado oculto en los manifiestos de metadatos (que separa el esquema de partición de las rutas físicas) junto con vectores de borrado posicionales y aislamiento de instantáneas (snapshots).',
          correct: true,
          explanation:
            'Iceberg registra múltiples especificaciones de partición en metadatos para los archivos nuevos y aplica borrados merge-on-read mediante nuevos snapshots atómicos.',
        },
        {
          id: 'b',
          text: 'Mover y renombrar en caliente todas las carpetas físicas month=... en el almacenamiento de objetos aplicando un bloqueo exclusivo de tabla.',
          correct: false,
          explanation:
            'Reescribir directorios físicos estilo Hive bloquea el almacén y copia terabytes innecesariamente.',
        },
        {
          id: 'c',
          text: 'Editar directamente los bytes a mitad de un archivo Parquet existente en S3 sin generar metadatos nuevos.',
          correct: false,
          explanation:
            'Los objetos en almacenamiento cloud y los archivos Parquet son inmutables; todo cambio en Iceberg produce un nuevo árbol de metadatos.',
        },
      ],
    },
  ],
  da: [
    {
      slot: 8,
      level: 2,
      track: 'da',
      topic: 'Error estándar e intervalos de confianza',
      question:
        'Comparas la conversión de dos tiendas de Mercado Brisa esta semana: la tienda nueva convierte al 5,4 % sobre 180 visitas y la tienda central al 4,9 % sobre 22.000 visitas. ¿Por qué sería un error declarar que la tienda nueva tiene mejor conversión estructural?',
      options: [
        {
          id: 'a',
          text: 'Porque con n = 180 el error estándar es alto y el intervalo de confianza al 95 % abarca varios puntos porcentuales; la diferencia de 0,5 puntos es indistinguible del ruido muestral.',
          correct: true,
          explanation:
            'El error estándar de una proporción escala con 1/√n; muestras pequeñas producen tasas extremas por puro azar.',
        },
        {
          id: 'b',
          text: 'Porque las muestras pequeñas tienen siempre menor varianza que las muestras grandes.',
          correct: false,
          explanation:
            'Al contrario: cuanto menor es el tamaño muestral, mayor es la varianza del estimador de la media o proporción.',
        },
        {
          id: 'c',
          text: 'Porque dos proporciones solo pueden compararse si ambas tiendas tienen exactamente el mismo número de visitas.',
          correct: false,
          explanation:
            'Las pruebas de dos proporciones y los intervalos de confianza permiten comparar tamaños distintos contabilizando la incertidumbre de cada grupo.',
        },
      ],
    },
    {
      slot: 9,
      level: 3,
      track: 'da',
      topic: 'Paradoja de Simpson y variables de confusión',
      question:
        'Al analizar el tiempo de entrega de dos operadores logísticos (A y B), ves que B es más rápido que A tanto en pedidos urbanos como en pedidos rurales por separado. Sin embargo, en el promedio general sin segmentar, A parece más rápido que B. ¿Qué ocurre?',
      options: [
        {
          id: 'a',
          text: 'Es la paradoja de Simpson: el operador B realizó una proporción mucho mayor de entregas rurales (que son más largas para todos), sesgando su media global no ponderada.',
          correct: true,
          explanation:
            'La zona geográfica actúa como variable de confusión porque afecta simultáneamente a la asignación del operador y al tiempo de recorrido.',
        },
        {
          id: 'b',
          text: 'Es un error aritmético de redondeo en la consulta SQL, ya que un promedio global nunca puede invertir el signo de sus subgrupos.',
          correct: false,
          explanation:
            'Cuando los pesos relativos de los subgrupos difieren entre A y B, la media ponderada global puede invertir legítimamente la dirección de todos los subgrupos.',
        },
        {
          id: 'c',
          text: 'Es sobreajuste estadístico por dividir una tabla en dos segmentos operativos.',
          correct: false,
          explanation:
            'Estratificar por la variable de confusión que determina la dificultad del reparto es necesario para una comparación justa.',
        },
      ],
    },
    {
      slot: 10,
      level: 3,
      track: 'da',
      topic: 'Experimentación A/B: diagnóstico SRM y CUPED',
      question:
        'En un experimento A/B configurado al 50 % / 50 % sobre el flujo de pago de Mercado Brisa, al quinto día observas 15.400 usuarios en Control y 13.100 en Tratamiento. Quieres estimar el impacto en el ingreso por usuario usando CUPED. ¿Qué paso va primero?',
      options: [
        {
          id: 'a',
          text: 'Ejecutar un test chi-cuadrado de desequilibrio muestral (SRM): un desvío tan severo del 50/50 indica un fallo en la asignación o telemetría que invalida la prueba antes de aplicar CUPED.',
          correct: true,
          explanation:
            'SRM (Sample Ratio Mismatch) revela pérdida selectiva de eventos o redirecciones rotas; ni el p-valor ni CUPED corrigen una aleatorización rota.',
        },
        {
          id: 'b',
          text: 'Aplicar CUPED usando como covariable el gasto posterior al inicio del experimento para equilibrar automáticamente el número de usuarios.',
          correct: false,
          explanation:
            'CUPED exige una covariable medida antes del tratamiento para reducir varianza sin introducir sesgo post-tratamiento, y no repara un SRM.',
        },
        {
          id: 'c',
          text: 'Detener el experimento de inmediato si el p-valor del día 5 es menor a 0,05 y desplegar a producción.',
          correct: false,
          explanation:
            'Detener la prueba prematuramente (peeking) infla los falsos positivos, y hacerlo con SRM activo lleva a decisiones erróneas.',
        },
      ],
    },
  ],
  bi: [
    {
      slot: 8,
      level: 2,
      track: 'bi',
      topic: 'Métricas no aditivas y agregación correcta',
      question:
        'En el tablero ejecutivo de Mercado Brisa necesitas mostrar el margen bruto porcentual (margen / ingreso neto) por categoría y para el total de la empresa. Si precalculas margin_pct en una tabla diaria por tienda y en el reporte usas AVG(margin_pct), ¿por qué el total es erróneo?',
      options: [
        {
          id: 'a',
          text: 'Porque una razón es una métrica no aditiva: promediar porcentajes da el mismo peso a una tienda con 10 pedidos que a una con 5.000. Debe definirse como SUM(margen) / NULLIF(SUM(ingreso_neto), 0) al nivel visualizado.',
          correct: true,
          explanation:
            'En un modelo semántico bien gobernado se agregan primero el numerador y el denominador por separado y se divide al final.',
        },
        {
          id: 'b',
          text: 'Porque AVG() en SQL descarta automáticamente las tiendas cuyo margen sea negativo.',
          correct: false,
          explanation:
            'AVG() incluye valores negativos; el error proviene de no ponderar cada tienda y día por su volumen de ingresos.',
        },
        {
          id: 'c',
          text: 'Porque los porcentajes solo pueden sumarse con SUM(margin_pct) al cambiar de nivel en la jerarquía.',
          correct: false,
          explanation:
            'Sumar porcentajes entre tiendas produciría márgenes absurdos superiores al 100 %.',
        },
      ],
    },
    {
      slot: 9,
      level: 3,
      track: 'bi',
      topic: 'Evaluación en DAX: contexto de filtro y CALCULATE',
      question:
        'En un modelo en estrella en Power BI quieres una medida DAX que calcule qué proporción representa la tienda actual sobre las ventas de todas las tiendas de su misma región, respetando cualquier filtro de año o categoría activo en el reporte. ¿Qué fórmula es correcta?',
      codeSnippet: `Peso en Región =
VAR VentasTienda = [Ingreso Neto]
VAR VentasRegion =
  CALCULATE(
    [Ingreso Neto],
    REMOVEFILTERS('stores'[store_id], 'stores'[store_name])
  )
RETURN
  DIVIDE(VentasTienda, VentasRegion)`,
      options: [
        {
          id: 'a',
          text: 'Guardar [Ingreso Neto] en una variable, usar CALCULATE con REMOVEFILTERS sobre la tienda (conservando el filtro de región y fecha) para el denominador, y dividir con DIVIDE.',
          correct: true,
          explanation:
            'REMOVEFILTERS sobre los atributos de tienda limpia solo el grano de tienda dentro de CALCULATE sin alterar los filtros de región, producto ni calendario.',
        },
        {
          id: 'b',
          text: 'Crear una columna calculada física en la tabla orders que divida cada fila entre SUM(orders[net_amount]) y luego promediarla.',
          correct: false,
          explanation:
            'Las columnas calculadas se evalúan al refrescar el modelo y no responden dinámicamente a los filtros de fecha o producto que el usuario elija en pantalla.',
        },
        {
          id: 'c',
          text: 'Activar relaciones bidireccionales muchos a muchos entre todas las tablas del modelo sin usar CALCULATE.',
          correct: false,
          explanation:
            'Los filtros bidireccionales indiscriminados crean rutas ambiguas en el esquema en estrella y degradan el rendimiento de VertiPaq.',
        },
      ],
    },
    {
      slot: 10,
      level: 3,
      track: 'bi',
      topic: 'Capa semántica, seguridad RLS y asistentes MCP',
      question:
        'En Mercado Brisa necesitas que 40 gerentes de tienda abran el mismo tablero certificado viendo solo su tienda, y que un asistente de lenguaje conectado por MCP responda preguntas de negocio con exactamente las mismas cifras que el tablero. ¿Qué arquitectura lo garantiza?',
      options: [
        {
          id: 'a',
          text: 'Definir las métricas y relaciones en una capa semántica con seguridad a nivel de fila (RLS dinámica por usuario) y hacer que tanto el tablero como el servidor MCP consulten esa capa en lugar de generar SQL libre sobre tablas crudas.',
          correct: true,
          explanation:
            'La capa semántica centraliza la fórmula canónica y las reglas RLS, evitando tanto duplicar reportes como que el asistente invente JOINs o salte permisos.',
        },
        {
          id: 'b',
          text: 'Clonar 40 archivos de reporte distintos a mano y dejar que el asistente de IA escriba SQL libre contra las tablas de ingesta sin restricciones.',
          correct: false,
          explanation:
            'Mantener 40 copias rompe la consistencia al primer cambio de métrica, y el SQL libre sobre tablas crudas provoca errores de fan-out y fugas de datos.',
        },
        {
          id: 'c',
          text: 'Ocultar el selector de tienda en la interfaz visual confiando en que nadie cambie el filtro en su navegador.',
          correct: false,
          explanation:
            'Un filtro visual oculto no es seguridad de datos; la restricción debe aplicarse en el motor del modelo mediante RLS.',
        },
      ],
    },
  ],
};

function buildQuestionList(trackId) {
  const safeTrack = trackId === 'de' || trackId === 'da' || trackId === 'bi' ? trackId : 'da';
  const rawList = [...CORE_QUESTIONS, ...(AREA_QUESTIONS[safeTrack] || AREA_QUESTIONS.da)];
  return rawList.map((q) => {
    const shift = (q.slot - 1) % q.options.length;
    const rotatedOptions = [
      ...q.options.slice(shift),
      ...q.options.slice(0, shift),
    ];
    return {
      ...q,
      options: rotatedOptions,
    };
  });
}

export function collectKnownLessonIdsForLevel(trackId, targetLevel) {
  const numericLevel = Math.min(4, Math.max(0, Math.floor(Number(targetLevel) || 0)));
  if (numericLevel <= 0) return [];
  const safeTrack = trackId === 'de' || trackId === 'da' || trackId === 'bi' ? trackId : 'da';
  const modules = getTrackPath(safeTrack).filter((m) => m.level < numericLevel);
  const idSet = new Set();

  for (const mod of modules) {
    for (const lesson of mod.lessons || []) {
      if (lesson.id) idSet.add(lesson.id);
      if (lesson.legacyId) idSet.add(lesson.legacyId);
      const matched =
        LESSONS_BY_ID[lesson.id] ||
        (lesson.legacyId ? LESSONS_BY_ID[lesson.legacyId] : null);
      if (matched?.id) idSet.add(matched.id);
      if (matched?.legacyId) idSet.add(matched.legacyId);
    }
  }

  return [...idSet];
}

export function computeDiagnosticEvaluation(answersBySlot, trackId) {
  const safeTrack = trackId === 'de' || trackId === 'da' || trackId === 'bi' ? trackId : 'da';
  const questions = buildQuestionList(safeTrack);

  const byLevel = {
    0: { total: 0, correct: 0 },
    1: { total: 0, correct: 0 },
    2: { total: 0, correct: 0 },
    3: { total: 0, correct: 0 },
  };

  let totalCorrect = 0;
  for (const q of questions) {
    byLevel[q.level].total += 1;
    const ans = answersBySlot[q.slot];
    if (ans?.correct) {
      byLevel[q.level].correct += 1;
      totalCorrect += 1;
    }
  }

  // Regla de sugerencia de nivel (0..3) según dominio progresivo:
  // - Domina N0 y N1 (>= 7 aciertos totales y base sólida): sugiere Nivel 2 (inicio del área) o Nivel 3 si acertó todo
  // - Domina N0 (4..6 aciertos): sugiere Nivel 1 (Fundamentos)
  // - < 4 aciertos: sugiere Nivel 0 (Cimientos)
  let suggestedLevel = 0;
  if (totalCorrect >= 7 && byLevel[0].correct >= 1 && byLevel[1].correct >= 2) {
    suggestedLevel = 2;
  } else if (totalCorrect >= 4 && byLevel[0].correct >= 1) {
    suggestedLevel = 1;
  } else {
    suggestedLevel = 0;
  }

  const trackMeta = TRACKS.find((t) => t.id === safeTrack) || TRACKS[2];
  const levelMeta = LEVELS.find((l) => l.level === suggestedLevel) || LEVELS[0];

  let summary = '';
  if (totalCorrect >= 9) {
    summary = `Acertaste ${totalCorrect} de 10 preguntas, incluyendo los casos avanzados de ${trackMeta.name}. Te sugerimos empezar en el Nivel 2 (${levelMeta.name}, donde arranca tu especialidad de ${trackMeta.short}) marcando los niveles 0 y 1 como sabidos, o elegir directamente el Nivel 3 si quieres saltar también el bloque intermedio.`;
  } else if (suggestedLevel === 2) {
    summary = `Obtuviste ${totalCorrect} de 10 aciertos. Manejas con solvencia los cimientos y el SQL relacional sin fan-out. Te sugerimos iniciar en el Nivel 2 (${levelMeta.name}) para entrar directo a SQL analítico, modelado dimensional y los primeros módulos de ${trackMeta.name}.`;
  } else if (suggestedLevel === 1) {
    summary = `Obtuviste ${totalCorrect} de 10 aciertos. Conoces los conceptos iniciales de tablas y medidas descriptivas, pero conviene afianzar JOINs, control del grano y calidad de datos en el Nivel 1 (Fundamentos). El Nivel 0 se marcará como sabido.`;
  } else {
    summary = `Obtuviste ${totalCorrect} de 10 aciertos. El mejor punto de partida es el Nivel 0 (Cimientos): construirás una base firme en tipos de datos, valores nulos, hojas de cálculo, estadística descriptiva y herramientas antes de escribir consultas complejas.`;
  }

  return {
    track: safeTrack,
    trackName: trackMeta.name,
    totalCorrect,
    totalQuestions: 10,
    byLevel,
    suggestedLevel,
    summary,
  };
}

export function DiagnosticModal({
  isOpen,
  onClose,
  onCompleteDiagnostic,
  initialTrack,
  deferCompleteOnboarding = false,
}) {
  const profile = useProfile();
  const [activeTrack, setActiveTrack] = useState(
    () => initialTrack || profile.track || 'da'
  );
  const [stepMode, setStepMode] = useState('quiz'); // 'quiz' | 'results'
  const [currentSlot, setCurrentSlot] = useState(1); // 1..10
  const [answersBySlot, setAnswersBySlot] = useState({});
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showItemFeedback, setShowItemFeedback] = useState(false);
  const [confirmedLevel, setConfirmedLevel] = useState(0);

  useEffect(() => {
    if (initialTrack && (initialTrack === 'de' || initialTrack === 'da' || initialTrack === 'bi')) {
      setActiveTrack(initialTrack);
    } else if (profile.track && (profile.track === 'de' || profile.track === 'da' || profile.track === 'bi')) {
      setActiveTrack(profile.track);
    }
  }, [initialTrack, profile.track, isOpen]);

  useEffect(() => {
    if (true || profile.onboarded || typeof document === 'undefined') return;
    const navButtons = document.querySelectorAll(
      '.app-sidebar__nav button, .app-bottom-nav button'
    );
    for (const btn of navButtons) {
      if (btn.textContent && btn.textContent.trim().startsWith('Ruta')) {
        if (btn.getAttribute('aria-current') !== 'page') {
          btn.click();
        }
        break;
      }
    }
  }, [profile.onboarded]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const questions = useMemo(() => buildQuestionList(activeTrack), [activeTrack]);

  const currentQuestion = useMemo(
    () => questions.find((q) => q.slot === currentSlot) || questions[0],
    [questions, currentSlot]
  );

  const evaluation = useMemo(
    () => computeDiagnosticEvaluation(answersBySlot, activeTrack),
    [answersBySlot, activeTrack]
  );

  if (!isOpen) return null;

  const handleTrackSwitch = (nextTrackId) => {
    if (nextTrackId !== 'de' && nextTrackId !== 'da' && nextTrackId !== 'bi') return;
    setActiveTrack(nextTrackId);
    // Si cambia de área, reiniciamos las respuestas de las preguntas 8..10 que son específicas del área
    setAnswersBySlot((prev) => {
      const next = { ...prev };
      delete next[8];
      delete next[9];
      delete next[10];
      return next;
    });
    if (currentSlot >= 8) {
      setSelectedOptionId(null);
      setShowItemFeedback(false);
    }
  };

  const handleSelectOption = (option) => {
    setSelectedOptionId(option.id);
    setShowItemFeedback(true);
    setAnswersBySlot((prev) => ({
      ...prev,
      [currentSlot]: {
        slot: currentSlot,
        level: currentQuestion.level,
        optionId: option.id,
        correct: Boolean(option.correct),
      },
    }));
  };

  const handleGoToSlot = (targetSlot) => {
    if (targetSlot < 1 || targetSlot > 10) return;
    setCurrentSlot(targetSlot);
    const saved = answersBySlot[targetSlot];
    setSelectedOptionId(saved ? saved.optionId : null);
    setShowItemFeedback(Boolean(saved));
  };

  const handleNextQuestion = () => {
    if (currentSlot < 10) {
      handleGoToSlot(currentSlot + 1);
    } else {
      const resultEval = computeDiagnosticEvaluation(answersBySlot, activeTrack);
      setConfirmedLevel(resultEval.suggestedLevel);
      setStepMode('results');
    }
  };

  const handleResetQuiz = () => {
    setAnswersBySlot({});
    setCurrentSlot(1);
    setSelectedOptionId(null);
    setShowItemFeedback(false);
    setStepMode('quiz');
  };

  const handleConfirmAndApply = () => {
    const finalLevel = Math.min(3, Math.max(0, Number(confirmedLevel) || 0));
    const knownIds = collectKnownLessonIdsForLevel(activeTrack, finalLevel);

    setTrack(activeTrack);
    setStartLevel(finalLevel);
    if (knownIds.length > 0) {
      markLessonKnown(knownIds);
    }
    if (!deferCompleteOnboarding) {
      completeOnboarding({
        track: activeTrack,
        startLevel: finalLevel,
      });
    }

    const levelObj = LEVELS.find((l) => l.level === finalLevel) || LEVELS[0];
    const trackObj = TRACKS.find((t) => t.id === activeTrack) || TRACKS[2];

    const payload = {
      mode: 'diagnostic-10q',
      track: activeTrack,
      targetRole: activeTrack,
      preferredRole: activeTrack,
      suggestedLevel: evaluation.suggestedLevel,
      startLevel: finalLevel,
      confirmedLevel: finalLevel,
      score: evaluation.totalCorrect,
      total: 10,
      byLevel: evaluation.byLevel,
      knownLessonsCount: knownIds.length,
      profileLabel: `Nivel ${finalLevel} (${levelObj.name}) · ${trackObj.short}`,
      summary: evaluation.summary,
      completedAt: new Date().toISOString(),
    };

    setDiagnosticResult(payload);

    if (typeof onCompleteDiagnostic === 'function') {
      onCompleteDiagnostic(payload);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const selectedOptionObj = currentQuestion.options.find(
    (o) => o.id === selectedOptionId
  );
  const progressPct = Math.round((currentSlot / 10) * 100);
  const levelInfo = LEVELS.find((l) => l.level === currentQuestion.level) || LEVELS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="grano-diagnostic-title"
      className="grano-diag-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="grano-diag-modal">
        <header className="grano-diag-header">
          <div>
            <div className="grano-diag-header__eyebrow">
              Prueba de nivel · 10 preguntas (niveles 0 a 3)
            </div>
            <h2 id="grano-diagnostic-title" className="grano-diag-header__title">
              Calibra tu punto de partida
            </h2>
            <p className="grano-diag-header__sub">
              Evalúa conocimientos del tronco común (preguntas 1–7) y de tu área elegida (preguntas 8–10).
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            ariaLabel="Cerrar prueba de nivel"
          >
            <X size={16} />
            <span>Cerrar</span>
          </Button>
        </header>

        <div className="grano-diag-toolbar">
          <span className="grano-diag-toolbar__label">
            Área evaluada en las preguntas 8 a 10:
          </span>
          <Segmented
            size="sm"
            ariaLabel="Área para la prueba de nivel"
            value={activeTrack}
            onChange={handleTrackSwitch}
            options={[
              { id: 'de', label: 'DE · Ingeniería', track: 'de' },
              { id: 'da', label: 'DA · Análisis', track: 'da' },
              { id: 'bi', label: 'BI · Business Intelligence', track: 'bi' },
            ]}
          />
        </div>

        {stepMode === 'quiz' && (
          <div className="grano-diag-body">
            <div className="grano-diag-progress">
              <div className="grano-diag-progress__top">
                <div className="grano-diag-progress__meta">
                  <Chip
                    track={
                      currentQuestion.track !== 'core'
                        ? currentQuestion.track
                        : undefined
                    }
                  >
                    {currentQuestion.track === 'core'
                      ? 'Tronco común'
                      : `Área ${currentQuestion.track.toUpperCase()}`}
                  </Chip>
                  <Chip>
                    Nivel {currentQuestion.level} · {levelInfo.name}
                  </Chip>
                  <Chip>{currentQuestion.topic}</Chip>
                </div>

                <span className="grano-diag-progress__counter tabular">
                  Pregunta {currentSlot} de 10
                </span>
              </div>

              <ProgressBar
                size="sm"
                thickness={4}
                value={progressPct}
                ariaLabel={`Progreso de la prueba: pregunta ${currentSlot} de 10`}
              />

              <div
                className="grano-diag-slots"
                role="group"
                aria-label="Indicador de las 10 preguntas"
              >
                {questions.map((q) => {
                  const ans = answersBySlot[q.slot];
                  const isCurrent = q.slot === currentSlot;
                  const stateCls = isCurrent
                    ? 'is-current'
                    : ans
                      ? ans.correct
                        ? 'is-correct'
                        : 'is-incorrect'
                      : '';
                  return (
                    <button
                      key={q.slot}
                      type="button"
                      className={`grano-diag-slot ${stateCls}`.trim()}
                      onClick={() => handleGoToSlot(q.slot)}
                      aria-label={`Ir a pregunta ${q.slot} (Nivel ${q.level})`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grano-diag-question-box">
              <h3 className="grano-diag-question-box__title">
                {currentQuestion.question}
              </h3>

              {currentQuestion.codeSnippet && (
                <pre className="grano-diag-question-box__code tabular">
                  <code>{currentQuestion.codeSnippet}</code>
                </pre>
              )}
            </div>

            <fieldset className="grano-diag-options">
              <legend className="grano-diag-options__legend">
                Elige una opción:
              </legend>

              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                let optState = 'neutral';
                if (showItemFeedback) {
                  if (opt.correct) optState = 'correct';
                  else if (isSelected) optState = 'incorrect';
                } else if (isSelected) {
                  optState = 'selected';
                }

                return (
                  <AnswerOption
                    key={opt.id}
                    index={idx}
                    letter={['A', 'B', 'C'][idx] || opt.id.toUpperCase()}
                    state={optState}
                    explanation={
                      showItemFeedback && (isSelected || opt.correct)
                        ? opt.explanation
                        : undefined
                    }
                    onClick={() => handleSelectOption(opt)}
                  >
                    {opt.text}
                  </AnswerOption>
                );
              })}
            </fieldset>

            {showItemFeedback && selectedOptionObj && (
              <Callout
                variant={selectedOptionObj.correct ? 'success' : 'warning'}
                title={
                  selectedOptionObj.correct
                    ? 'Respuesta correcta'
                    : 'Concepto para reforzar en tu ruta'
                }
              >
                {selectedOptionObj.explanation}
              </Callout>
            )}

            <footer className="grano-diag-footer">
              <span className="grano-diag-toolbar__label tabular">
                Respondidas: {Object.keys(answersBySlot).length} de 10
              </span>

              <div className="grano-diag-footer__actions">
                {currentSlot > 1 && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleGoToSlot(currentSlot - 1)}
                  >
                    Anterior
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedOptionId}
                  onClick={handleNextQuestion}
                >
                  {currentSlot < 10 ? 'Siguiente pregunta' : 'Ver resultado'}
                </Button>
              </div>
            </footer>
          </div>
        )}

        {stepMode === 'results' && (
          <div className="grano-diag-body">
            <div className="grano-diag-result-banner">
              <div className="grano-diag-result-banner__top">
                <Chip track={activeTrack}>{evaluation.trackName}</Chip>
                <span className="grano-diag-progress__counter tabular">
                  Resultado: {evaluation.totalCorrect} / 10 aciertos
                </span>
              </div>

              <h3 className="grano-diag-result-banner__title">
                Nivel sugerido: Nivel {evaluation.suggestedLevel} ·{' '}
                {LEVELS[evaluation.suggestedLevel]?.name} ({evaluation.trackName})
              </h3>
              <p className="grano-diag-result-banner__desc">
                {evaluation.summary}
              </p>
            </div>

            <div className="grano-diag-breakdown">
              {[0, 1, 2, 3].map((lvl) => {
                const stat = evaluation.byLevel[lvl];
                const lvlMeta = LEVELS.find((l) => l.level === lvl);
                return (
                  <div key={lvl} className="grano-diag-level-score">
                    <span className="grano-diag-level-score__head">
                      N{lvl} · {lvlMeta?.name}
                    </span>
                    <span className="grano-diag-level-score__val tabular">
                      {stat.correct} / {stat.total}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grano-diag-override">
              <h4 className="grano-diag-override__title">
                Elige o corrige tu nivel de inicio antes de confirmar
              </h4>
              <p className="grano-diag-override__hint">
                Las lecciones de niveles anteriores al elegido se marcarán como{' '}
                <strong>sabidas</strong> (no como completadas) y podrás abrirlas cuando quieras.
              </p>

              <div
                className="grano-diag-override__grid"
                role="radiogroup"
                aria-label="Nivel de inicio"
              >
                {[0, 1, 2, 3].map((lvl) => {
                  const lvlMeta = LEVELS.find((l) => l.level === lvl);
                  const knownCount = collectKnownLessonIdsForLevel(
                    activeTrack,
                    lvl
                  ).filter((id) => !id.startsWith('l')).length;
                  const isSuggested = lvl === evaluation.suggestedLevel;
                  const isSelected = lvl === confirmedLevel;

                  return (
                    <button
                      key={lvl}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`grano-diag-level-option ${
                        isSelected ? 'is-active' : ''
                      }`.trim()}
                      onClick={() => setConfirmedLevel(lvl)}
                    >
                      <span className="grano-diag-level-option__num tabular">
                        Nivel {lvl} {isSuggested ? '· Sugerido' : ''}
                      </span>
                      <span className="grano-diag-level-option__name">
                        {lvlMeta?.name}
                      </span>
                      <span className="grano-diag-level-option__known tabular">
                        {lvl === 0
                          ? 'Desde cero (0 sabidas)'
                          : `${knownCount} lecciones como sabidas`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <footer className="grano-diag-footer">
              <Button variant="secondary" size="md" onClick={handleResetQuiz}>
                <RotateCcw size={14} />
                <span>Repetir prueba</span>
              </Button>

              <div className="grano-diag-footer__actions">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmAndApply}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirmar nivel {confirmedLevel}</span>
                </Button>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticModal;
