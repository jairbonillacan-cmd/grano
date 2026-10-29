const lesson = {
  id: 'c1-viz-03-color-accesibilidad',
  moduleId: 'c1-viz',
  tracks: ['core'],
  level: 1,
  order: 3,
  title: 'Color con intención: paletas secuenciales y accesibilidad',
  minutes: 20,
  prerequisites: ['c1-viz-02-ejes-escalas-cero'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), un tablero de seguimiento de las 14 tiendas asigna 14 colores del arcoíris a las barras de ventas y marca las desviaciones contra la meta únicamente con círculos rojos o verdes sin texto ni signo. En la reunión mensual, el director de operaciones —que padece deuteranopía— no logra distinguir qué tiendas incumplieron el objetivo ni cuál de los 14 colores corresponde a cada sucursal. ¿Cómo eliges una paleta acorde al dato y garantizas que cualquier persona lea las alertas sin depender solo del color?',

  objectives: [
    'Elegir entre paletas cualitativas, secuenciales y divergentes según el tipo y el punto de referencia de la variable.',
    'Usar el color como señal de excepción limitando el número de tonos categóricos y agrupando el resto en contexto neutro.',
    'Aplicar los criterios WCAG 2.2 (1.4.1 y 1.4.11) y paletas seguras ante daltonismo con redundancia textual en SQL.'
  ],

  sections: [
    {
      id: 'tres-familias-de-paletas',
      heading: 'Cualitativa, secuencial y divergente: cada dato pide su escala',
      body: 'El color en un gráfico no sirve para decorar el lienzo. Su función es codificar la estructura de los datos. La cartógrafa Cynthia Brewer sistematizó en ColorBrewer tres familias de paletas según el tipo de variable.\n\n1. Las paletas cualitativas usan tonos distintos (`azul`, `naranja`, `verde azulado`, `púrpura`) con luminancia similar. Sirven para distinguir categorías sin orden jerárquico, como canales de adquisición o regiones. Como ninguna categoría es mayor por naturaleza, ningún color debe brillar mucho más que los demás.\n\n2. Las paletas secuenciales varían de claro a oscuro en un solo tono o entre dos tonos vecinos. Representan magnitudes ordenadas que van desde cero hasta un máximo, como el volumen de pedidos o el ingreso.\n\n3. Una **paleta de color divergente** une dos escalas secuenciales en un punto central neutro (gris claro o blanco). Ese centro representa una referencia con significado real, como `0 %` de desviación respecto a la meta. Hacia un extremo se intensifica un tono (como azul para sobrecumplimiento) y hacia el opuesto otro tono contrastante (naranja para caídas).'
    },
    {
      id: 'color-como-senal-de-excepcion',
      heading: 'El límite de categorías y el color como señal de excepción',
      body: 'Cuando un gráfico asigna un color distinto a 12 o 14 tiendas, la memoria de trabajo se satura. El lector tiene que viajar con la vista entre las barras y la leyenda para recordar qué tienda era cada color. En una paleta cualitativa, el límite práctico es de **5 a 7 categorías** como máximo.\n\nSi tu consulta devuelve más de 5 categorías, agrupa el resto bajo una categoría explícita (`Otras tiendas`). También puedes aplicar la regla del **color como señal de excepción**.\n\n- Pinta las barras o series que sirven de contexto en tonos grises neutros.\n- Reserva el color de acento saturado únicamente para las filas que superan un umbral o requieren una decisión inmediata.\n\nDe ese modo, el sistema visual detecta de forma preatentiva —en menos de 200 milisegundos— dónde está el hallazgo principal del gráfico.',
      example: {
        language: 'sql',
        code: `WITH ventas_region_2024 AS (
  SELECT
    s.region,
    COUNT(o.order_id) AS pedidos,
    ROUND(SUM(o.total_usd), 2) AS ingreso_usd,
    ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE o.status = 'completed'
    AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
  GROUP BY s.region
)
SELECT
  region,
  pedidos,
  ingreso_usd,
  ticket_medio_usd,
  ROUND(ticket_medio_usd - 420.00, 2) AS delta_vs_meta_usd,
  CASE
    WHEN ticket_medio_usd >= 420.00 THEN 'SOBRE META [+]'
    WHEN ticket_medio_usd >= 405.00 THEN 'EN RANGO [=]'
    ELSE 'BAJO META [-]'
  END AS estado_accesible
FROM ventas_region_2024
ORDER BY delta_vs_meta_usd DESC;`,
        expectedOutput: [
          {
            region: 'Iberia',
            pedidos: 1232,
            ingreso_usd: 590458.99,
            ticket_medio_usd: 479.27,
            delta_vs_meta_usd: 59.27,
            estado_accesible: 'SOBRE META [+]'
          },
          {
            region: 'Cono Sur',
            pedidos: 2199,
            ingreso_usd: 919026.32,
            ticket_medio_usd: 417.93,
            delta_vs_meta_usd: -2.07,
            estado_accesible: 'EN RANGO [=]'
          },
          {
            region: 'Norteamérica',
            pedidos: 912,
            ingreso_usd: 363700.11,
            ticket_medio_usd: 398.79,
            delta_vs_meta_usd: -21.21,
            estado_accesible: 'BAJO META [-]'
          },
          {
            region: 'Andina',
            pedidos: 2154,
            ingreso_usd: 858331.08,
            ticket_medio_usd: 398.48,
            delta_vs_meta_usd: -21.52,
            estado_accesible: 'BAJO META [-]'
          }
        ]
      }
    },
    {
      id: 'daltonismo-y-paleta-okabe-ito',
      heading: 'Por qué falla el semáforo rojo-verde y cómo resolverlo',
      body: 'Cerca del `8 %` de los hombres y el `0.5 %` de las mujeres presentan alguna deficiencia en la visión del color. Las más comunes son la **deuteranopía** y la protanopía, que dificultan distinguir tonos rojos de verdes con similar luminosidad. En un equipo de 25 personas, es muy probable que al menos una no distinga un semáforo tradicional de círculos rojos y verdes.\n\nPara diseñar visualizaciones universales, Masataka Okabe y Kei Ito propusieron una paleta categórica segura. Sus tonos siguen siendo distinguibles bajo cualquier variante de daltonismo e incluso al imprimir en blanco y negro.\n\n- En escalas divergentes o de alerta, sustituye el par rojo-verde puro por un par **azul y naranja** con distinta luminosidad.\n- En escalas secuenciales, evita la paleta arcoíris (*jet* o *rainbow*). Esa escala crea bordes falsos donde el amarillo brilla más que el azul o el verde sin que el dato haya saltado.'
    },
    {
      id: 'contraste-wcag-y-redundancia',
      heading: 'Contraste no textual WCAG y codificación redundante',
      body: 'El estándar de accesibilidad web W3C WCAG 2.2 define dos reglas verificables para gráficos y tablas (**contraste no textual** y redundancia visual).\n\n- El Criterio 1.4.1 (Uso del color) establece que el color nunca debe ser el único medio visual para transmitir información o distinguir un estado. Acompaña siempre el color con un signo explícito (`+` / `-`) o una etiqueta textual (`SOBRE META [+]` / `BAJO META [-]`). También puedes sumar un icono con forma distinta (`[OK]` frente a `[!]`) o un patrón de trazo (línea continua frente a línea punteada).\n- El Criterio 1.4.11 exige que toda marca gráfica necesaria para comprender los datos tenga una razón de contraste de al menos **3:1** contra el fondo adyacente. El texto normal requiere al menos `4.5:1`.'
    }
  ],

  workedExample: {
    title: 'De un arcoíris inaccesible de 14 tiendas a foco jerárquico con etiqueta explícita',
    description: 'Compara una consulta que devuelve tiendas individuales con una columna de color rojo/verde muda frente a una consulta que destaca las 4 tiendas líderes, agrupa las 10 restantes en contexto gris y añade etiquetas legibles.',
    audit: 'Las 4 primeras sucursales representan el 52.7 % del ingreso completado de 2024 (1,440,819.74 USD) y las 10 restantes suman el 47.3 % (1,290,696.76 USD).',
    steps: [
      {
        label: 'Antipatrón: estado codificado solo con color rojo/verde y sin jerarquía',
        explanation: 'Devolver únicamente la palabra `"red"` o `"green"` incumple WCAG 1.4.1 para lectores de pantalla y personas con daltonismo, y listar las tiendas en orden alfabético dispersa la atención.',
        code: `SELECT
  s.store_code,
  ROUND(AVG(o.total_usd), 2) AS ticket_medio_usd,
  CASE
    WHEN AVG(o.total_usd) >= 420.00 THEN 'green'
    ELSE 'red'
  END AS color_semaforo
FROM stores s
JOIN orders o ON s.store_id = o.store_id
WHERE o.status = 'completed'
  AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
GROUP BY s.store_code
ORDER BY s.store_code ASC
LIMIT 6;`,
        expectedOutput: [
          {
            store_code: 'STR-AR-01',
            ticket_medio_usd: 389.59,
            color_semaforo: 'red'
          },
          {
            store_code: 'STR-CL-01',
            ticket_medio_usd: 412.89,
            color_semaforo: 'red'
          },
          {
            store_code: 'STR-CL-02',
            ticket_medio_usd: 503.12,
            color_semaforo: 'green'
          },
          {
            store_code: 'STR-CO-01',
            ticket_medio_usd: 336.62,
            color_semaforo: 'red'
          },
          {
            store_code: 'STR-CO-02',
            ticket_medio_usd: 351.37,
            color_semaforo: 'red'
          },
          {
            store_code: 'STR-ES-01',
            ticket_medio_usd: 407.99,
            color_semaforo: 'red'
          }
        ]
      },
      {
        label: 'Solución verificada: Top 4 en acento, resto agrupado en gris y rol explícito',
        explanation: 'Numeramos las tiendas por ingreso con `ROW_NUMBER()`, conservamos las 4 mayores como foco y colapsamos las 10 restantes en `"Otras tiendas (10)"` con un rol visual explícito.',
        code: `WITH ventas_tienda AS (
  SELECT
    s.store_name,
    SUM(o.total_usd) AS ingreso_usd,
    ROW_NUMBER() OVER (ORDER BY SUM(o.total_usd) DESC) AS rn
  FROM stores s
  JOIN orders o ON s.store_id = o.store_id
  WHERE o.status = 'completed'
    AND o.order_date BETWEEN DATE '2024-01-01' AND DATE '2024-12-31'
  GROUP BY s.store_name
)
SELECT
  CASE WHEN rn <= 4 THEN store_name ELSE 'Otras tiendas (10)' END AS grupo_visual,
  ROUND(SUM(ingreso_usd), 2) AS ingreso_usd,
  ROUND(100.0 * SUM(ingreso_usd) / SUM(SUM(ingreso_usd)) OVER (), 1) AS cuota_pct,
  CASE WHEN MIN(rn) <= 4 THEN 'FOCO [ACENTO]' ELSE 'CONTEXTO [GRIS]' END AS rol_color
FROM ventas_tienda
GROUP BY 1
ORDER BY MIN(rn) ASC;`,
        expectedOutput: [
          {
            grupo_visual: 'Tienda Palermo Soho',
            ingreso_usd: 495171.58,
            cuota_pct: 18.1,
            rol_color: 'FOCO [ACENTO]'
          },
          {
            grupo_visual: 'Tienda Miraflores',
            ingreso_usd: 387827.8,
            cuota_pct: 14.2,
            rol_color: 'FOCO [ACENTO]'
          },
          {
            grupo_visual: 'Almacén Logístico Coslada',
            ingreso_usd: 330913.73,
            cuota_pct: 12.1,
            rol_color: 'FOCO [ACENTO]'
          },
          {
            grupo_visual: 'Tienda Las Condes',
            ingreso_usd: 226906.63,
            cuota_pct: 8.3,
            rol_color: 'FOCO [ACENTO]'
          },
          {
            grupo_visual: 'Otras tiendas (10)',
            ingreso_usd: 1290696.76,
            cuota_pct: 47.3,
            rol_color: 'CONTEXTO [GRIS]'
          }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'chk-c1-viz-03-1',
      type: 'mcq',
      prompt: 'Quieres colorear un mapa de calor con la variación porcentual de ventas respecto a la meta mensual, donde los valores van de `-25 %` a `+25 %` y el `0 %` indica cumplimiento exacto. ¿Qué tipo de paleta corresponde?',
      options: [
        {
          id: 'a',
          text: 'Una paleta divergente con un color neutro en el 0 % y dos tonos distinguibles (como azul y naranja) hacia los extremos positivo y negativo.',
          correct: true,
          feedback: 'Correcto: como existe un punto central con significado analítico (0 % de desviación) y dos direcciones opuestas, la escala divergente refleja fielmente la estructura del dato.'
        },
        {
          id: 'b',
          text: 'Una paleta cualitativa de 10 colores aleatorios sin orden de luminosidad.',
          correct: false,
          feedback: 'Incorrecto: las paletas cualitativas sirven para categorías nominales sin orden, no para una magnitud continua con signo.'
        },
        {
          id: 'c',
          text: 'Una paleta secuencial de un solo tono que no distinga visualmente el punto donde los valores cruzan el 0 %.',
          correct: false,
          feedback: 'Incorrecto: una escala secuencial única oculta dónde termina el incumplimiento negativo y dónde empieza el sobrecumplimiento positivo.'
        }
      ],
      explanation: 'Cuando los datos cuantitativos se dividen alrededor de un valor de referencia crítico (como cero variación o una meta), una paleta divergente permite identificar tanto el sentido como la magnitud del desvío.'
    },
    {
      id: 'chk-c1-viz-03-2',
      type: 'mcq',
      prompt: 'Según los criterios 1.4.1 (Uso del color) y 1.4.11 (Contraste no textual) de WCAG 2.2, ¿qué requisitos debe cumplir un indicador visual de alerta en un reporte?',
      options: [
        {
          id: 'a',
          text: 'Alcanzar al menos 3:1 de contraste en las marcas gráficas contra el fondo (4.5:1 en texto) e incluir un signo, icono o etiqueta textual además del color.',
          correct: true,
          feedback: 'Correcto: combina el contraste mínimo normativo para elementos gráficos con codificación redundante para que el mensaje no dependa solo del tono cromático.'
        },
        {
          id: 'b',
          text: 'Usar únicamente un punto rojo brillante y un punto verde brillante sobre fondo blanco sin texto.',
          correct: false,
          feedback: 'Incorrecto: depender exclusivamente del color rojo/verde viola el criterio WCAG 1.4.1 y excluye a lectores con deuteranopía o protanopía.'
        },
        {
          id: 'c',
          text: 'Pintar todas las barras con un contraste de 1.2:1 para que la pantalla se vea suave.',
          correct: false,
          feedback: 'Incorrecto: un contraste de 1.2:1 está muy por debajo del mínimo de 3:1 exigido por WCAG 1.4.11 para objetos gráficos.'
        }
      ],
      explanation: 'WCAG 2.2 exige que los elementos gráficos informativos mantengan una razón de contraste mínima de 3:1 (texto normal 4.5:1) y que ningún estado se comunique únicamente mediante color.'
    },
    {
      id: 'chk-c1-viz-03-3',
      type: 'mcq',
      prompt: 'Un gráfico de líneas muestra la evolución diaria de las 14 tiendas de Mercado Brisa con 14 colores distintos para destacar que la `Tienda Palermo Soho` duplicó sus pedidos. ¿Cómo mejoras la jerarquía visual?',
      options: [
        {
          id: 'a',
          text: 'Pintar las otras 13 tiendas en un gris suave de contexto y resaltar solo la línea de `Tienda Palermo Soho` con el color de acento y etiqueta directa al final de la serie.',
          correct: true,
          feedback: 'Correcto: aplica el color como señal de excepción sobre un fondo de contexto neutro, guiando la atención en milisegundos sin borrar la referencia de las demás tiendas.'
        },
        {
          id: 'b',
          text: 'Añadir un degradado arcoíris en el fondo del gráfico y mantener los 14 colores en una leyenda inferior.',
          correct: false,
          feedback: 'Incorrecto: el fondo degradado reduce el contraste de las líneas y mantener 14 colores impide distinguir las trayectorias.'
        },
        {
          id: 'c',
          text: 'Cambiar las 14 líneas por 14 áreas apiladas en tres dimensiones.',
          correct: false,
          feedback: 'Incorrecto: las áreas apiladas en 3D ocluyen series enteras y distorsionan la lectura de todas las tiendas intermedias.'
        }
      ],
      explanation: 'Mantener las series de referencia en gris neutro y aplicar un único color de acento a la serie protagonista aprovecha la percepción preatentiva y elimina la sobrecarga de la leyenda.'
    },
    {
      id: 'chk-c1-viz-03-4',
      type: 'predict-output',
      prompt: 'En la tabla `marketing_spend`, el canal `referral` acumula `22306.35` USD de gasto y `1641` conversiones (`cpa_usd = 13.59`), mientras que los otros cuatro canales tienen un CPA entre `13.87` y `13.94` USD. Si la regla marca `ALERTA [!]` cuando `cpa_usd > 13.90`, ¿cuántos canales quedan marcados en alerta?',
      options: [
        {
          id: 'a',
          text: '3 canales (`display_video` con 13.94, `paid_social` con 13.93 y `email_campaign` con 13.92), mientras que `organic_search` (13.87) y `referral` (13.59) quedan en rango normal.',
          correct: true,
          feedback: 'Correcto: solo los tres canales cuyo CPA supera 13.90 USD reciben la marca de excepción y la etiqueta textual de alerta.'
        },
        {
          id: 'b',
          text: 'Los 5 canales quedan en alerta porque todos superan 10.00 USD.',
          correct: false,
          feedback: 'Incorrecto: el umbral definido es 13.90 USD; marcar todos los canales en alerta anula la jerarquía por excepción.'
        },
        {
          id: 'c',
          text: 'Ningún canal, porque el CPA promedio es menor a 13.00 USD.',
          correct: false,
          feedback: 'Incorrecto: tres canales superan 13.90 USD (13.94, 13.93 y 13.92 USD).'
        }
      ],
      explanation: 'Definir un umbral explícito en SQL y asociarle una etiqueta con símbolo (`ALERTA [!]` frente a `NORMAL [OK]`) garantiza que tanto el gráfico como la tabla comuniquen la excepción sin ambigüedad.'
    }
  ],

  practice: {
    type: 'sql',
    title: 'Auditoría de costo por conversión (CPA) por canal con etiqueta accesible',
    language: 'sql',
    prompt: 'Escribe una consulta sobre `marketing_spend` en Mercado Brisa que agrupe por `channel` y calcule: `gasto_total_usd` (`ROUND(SUM(spend_usd), 2)`), `conversiones` (`SUM(attributed_conversions)`), `cpa_usd` (`ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2)`) y la columna redundante `alerta_accesible`: si `SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0) > 13.90` devuelve `\'ALERTA [!]: CPA sobre umbral\'`, de lo contrario `\'NORMAL [OK]: CPA en rango\'`. Ordena por `cpa_usd DESC`.',
    starterCode: `SELECT
  channel,
  ROUND(SUM(spend_usd), 2) AS gasto_total_usd,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS cpa_usd,
  -- Clasifica con CASE WHEN si el CPA supera 13.90 USD para generar alerta_accesible
  'NORMAL [OK]: CPA en rango' AS alerta_accesible
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd DESC;`,
    expected: `SELECT
  channel,
  ROUND(SUM(spend_usd), 2) AS gasto_total_usd,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS cpa_usd,
  CASE
    WHEN SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0) > 13.90
      THEN 'ALERTA [!]: CPA sobre umbral'
    ELSE 'NORMAL [OK]: CPA en rango'
  END AS alerta_accesible
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd DESC;`,
    orderMatters: true,
    hints: [
      'Calcula el costo por conversión dividiendo la suma del gasto entre la suma de conversiones protegida con `NULLIF(SUM(attributed_conversions), 0)`.',
      'Usa una expresión `CASE WHEN SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0) > 13.90 THEN \'ALERTA [!]: CPA sobre umbral\' ELSE \'NORMAL [OK]: CPA en rango\' END AS alerta_accesible`.',
      'Conserva `ORDER BY cpa_usd DESC` para que los canales que requieren revisión aparezcan en la parte superior.'
    ],
    solution: `SELECT
  channel,
  ROUND(SUM(spend_usd), 2) AS gasto_total_usd,
  SUM(attributed_conversions) AS conversiones,
  ROUND(SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0), 2) AS cpa_usd,
  CASE
    WHEN SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0) > 13.90
      THEN 'ALERTA [!]: CPA sobre umbral'
    ELSE 'NORMAL [OK]: CPA en rango'
  END AS alerta_accesible
FROM marketing_spend
GROUP BY channel
ORDER BY cpa_usd DESC;`,
    solutionExplanation: 'Calcula el CPA agregado por canal (`SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0)`) y añade la columna `alerta_accesible` que incluye símbolo y texto explícito además de la clasificación por umbral, cumpliendo el criterio WCAG 1.4.1.',
    blanks: [
      {
        id: 'b1',
        answer: 'CASE WHEN'
      }
    ],
    expectedOutput: [
      {
        channel: 'display_video',
        gasto_total_usd: 46759.04,
        conversiones: 3355,
        cpa_usd: 13.94,
        alerta_accesible: 'ALERTA [!]: CPA sobre umbral'
      },
      {
        channel: 'paid_social',
        gasto_total_usd: 63080.29,
        conversiones: 4530,
        cpa_usd: 13.93,
        alerta_accesible: 'ALERTA [!]: CPA sobre umbral'
      },
      {
        channel: 'email_campaign',
        gasto_total_usd: 14102.07,
        conversiones: 1013,
        cpa_usd: 13.92,
        alerta_accesible: 'ALERTA [!]: CPA sobre umbral'
      },
      {
        channel: 'organic_search',
        gasto_total_usd: 26703.45,
        conversiones: 1925,
        cpa_usd: 13.87,
        alerta_accesible: 'NORMAL [OK]: CPA en rango'
      },
      {
        channel: 'referral',
        gasto_total_usd: 22306.35,
        conversiones: 1641,
        cpa_usd: 13.59,
        alerta_accesible: 'NORMAL [OK]: CPA en rango'
      }
    ],
    expectedOutputTable: [
      {
        channel: 'display_video',
        gasto_total_usd: 46759.04,
        conversiones: 3355,
        cpa_usd: 13.94,
        alerta_accesible: 'ALERTA [!]: CPA sobre umbral'
      },
      {
        channel: 'paid_social',
        gasto_total_usd: 63080.29,
        conversiones: 4530,
        cpa_usd: 13.93,
        alerta_accesible: 'ALERTA [!]: CPA sobre umbral'
      },
      {
        channel: 'email_campaign',
        gasto_total_usd: 14102.07,
        conversiones: 1013,
        cpa_usd: 13.92,
        alerta_accesible: 'ALERTA [!]: CPA sobre umbral'
      },
      {
        channel: 'organic_search',
        gasto_total_usd: 26703.45,
        conversiones: 1925,
        cpa_usd: 13.87,
        alerta_accesible: 'NORMAL [OK]: CPA en rango'
      },
      {
        channel: 'referral',
        gasto_total_usd: 22306.35,
        conversiones: 1641,
        cpa_usd: 13.59,
        alerta_accesible: 'NORMAL [OK]: CPA en rango'
      }
    ]
  },

  roleNotes: {
    de: 'Expón en las vistas analíticas columnas de estado semántico estandarizadas (`status_code`, `status_label`) junto con el valor numérico del umbral. Así evitas que diez reportes distintos inventen sus propias reglas de alerta con valores fijos contradictorios.',
    da: 'En tus cuadernos de análisis, configura por defecto una paleta apta para daltonismo (como Okabe-Ito para categorías y Viridis o Cividis para escalas continuas) y evita siempre la escala arcoíris.',
    bi: 'Define en el archivo de tema corporativo de tu herramienta de BI los tokens de color con contraste verificado (>= 3:1 en marcas gráficas y >= 4.5:1 en texto) y acompaña todo formato condicional con iconos o signos explícitos (`+`, `-`).'
  },

  summary: [
    'Elige paletas cualitativas para categorías sin orden, secuenciales para magnitudes desde cero y divergentes cuando exista un centro crítico.',
    'Limita las categorías coloreadas a un máximo de 5 a 7 y usa tonos grises neutros para el contexto.',
    'Sustituye el semáforo rojo-verde por pares distinguibles ante daltonismo, como azul y naranja.',
    'Cumple WCAG 2.2 garantizando contraste mínimo de 3:1 en marcas gráficas y acompañando el color con texto o símbolos.'
  ],

  flashcards: [
    {
      id: 'fc-c1-viz-03-1',
      front: '¿Cuándo debes elegir una paleta de color divergente en lugar de una secuencial?',
      back: 'Cuando la variable numérica tiene un punto central con significado analítico propio (como 0 % de variación contra la meta) y se desvía en dos sentidos opuestos.'
    },
    {
      id: 'fc-c1-viz-03-2',
      front: '¿Qué exigen los criterios WCAG 2.2 1.4.1 y 1.4.11 en un gráfico de datos?',
      back: 'No usar el color como único medio para transmitir información (1.4.1) y asegurar una razón de contraste de al menos 3:1 en los elementos gráficos frente al fondo (1.4.11).'
    },
    {
      id: 'fc-c1-viz-03-3',
      front: '¿Por qué debe evitarse la combinación rojo-verde pura en indicadores de estado?',
      back: 'Porque cerca del 8 % de los hombres y el 0.5 % de las mujeres presentan deuteranopía o protanopía y perciben ambos tonos como indistinguibles si tienen luminancia parecida.'
    },
    {
      id: 'fc-c1-viz-03-4',
      front: '¿Qué haces en SQL cuando un gráfico categórico tiene 14 tiendas y solo quieres destacar las 4 principales?',
      back: 'Numeras con ROW_NUMBER() OVER (ORDER BY metrica DESC) y agrupas con CASE WHEN rn <= 4 THEN tienda ELSE \'Otras tiendas\' en tono gris de contexto.'
    }
  ],

  glossaryTerms: [
    'paleta-divergente',
    'contraste-no-textual',
    'codificacion-visual'
  ],

  sources: [
    {
      title: 'Web Content Accessibility Guidelines (WCAG) 2.2 — Success Criterion 1.4.1 Use of Color & 1.4.11 Non-text Contrast',
      url: 'https://www.w3.org/TR/WCAG22/#non-text-contrast',
      publisher: 'World Wide Web Consortium (W3C)',
      accessed: '2026-10-29',
      supports: 'Requisitos normativos de contraste 3:1 para objetos gráficos y prohibición de depender exclusivamente del color.'
    },
    {
      title: 'ColorBrewer 2.0: Color Advice for Cartography and Sequential, Diverging, and Qualitative Schemes',
      url: 'https://colorbrewer2.org/',
      publisher: 'Cynthia A. Brewer & The Pennsylvania State University',
      accessed: '2026-10-29',
      supports: 'Diseño de paletas secuenciales, divergentes y cualitativas verificadas para personas con deficiencia en la visión del color.'
    },
    {
      title: 'Fundamentals of Data Visualization — Chapter 4: Color Scales & Chapter 19: Common Pitfalls of Color Use',
      url: 'https://clauswilke.com/dataviz/color-basics.html',
      publisher: 'Claus O. Wilke / O\'Reilly Media',
      accessed: '2026-10-29',
      supports: 'Uso del color como herramienta para resaltar excepciones, límite de categorías distinguibles y defectos de la escala arcoíris.'
    },
    {
      title: 'Color Universal Design (CUD): How to Make Figures and Presentations That Are Friendly to Colorblind People',
      url: 'https://jfly.uni-koeln.de/color/',
      publisher: 'Masataka Okabe & Kei Ito',
      accessed: '2026-10-29',
      supports: 'Paleta universal de Okabe-Ito y pautas de codificación redundante mediante etiquetas, signos y formas.'
    }
  ],

  aiNotes: 'Un error frecuente es confundir una paleta divergente con cualquier degradado de dos colores aunque el dato no tenga centro significativo, o olvidar que el costo por conversión agregado se calcula como `SUM(spend_usd) / NULLIF(SUM(attributed_conversions), 0)` y no como el promedio de ratios diarios. Recuerda siempre al estudiante por qué añadimos texto/símbolo junto al color (WCAG 1.4.1).'
};

export default lesson;
