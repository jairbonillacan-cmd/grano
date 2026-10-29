export const lesson = {
  id: 'bi3-dashboards-03-color-contraste-wcag-daltonismo',
  moduleId: 'bi3-dashboards',
  track: 'bi',
  tracks: ['bi', 'da'],
  level: 3,
  order: 3,
  contentVersion: 2,
  title: 'Color restringido, contraste WCAG y daltonismo',
  subtitle: 'Uso restringido del color, contraste WCAG y diseño accesible para daltonismo',
  minutes: 20,
  prerequisites: ['bi3-dashboards-02-jerarquia-visual-reticula-10s'],
  glossaryTerms: [
    'bi3-contraste-wcag',
    'bi3-doble-codificacion',
    'bi3-jerarquia-visual',
  ],
  datasets: ['orders', 'stores', 'refunds'],
  needsReview: false,
  hook: 'En la revisión mensual de Mercado Brisa, el tablero pinta las catorce tiendas con un arcoíris de catorce colores y marca las alertas de devolución únicamente con círculos rojos y verdes. El director financiero, que padece deuteranopía, no logra distinguir qué tiendas superaron el umbral de riesgo. ¿Cómo diseñamos una codificación cromática austera y universalmente legible?',
  objectives: [
    'Aplicar la regla 90/10 de uso restringido del color, reservando los tonos de alta saturación exclusivamente para anomalías y umbrales de acción.',
    'Verificar el cumplimiento de los criterios W3C WCAG 2.2 Nivel AA: razón de contraste 4,5:1 en texto normal, 3:1 en marcas gráficas y prohibición del color como canal único.',
    'Sustituir los semáforos rojo-verde por la paleta universal de Masataka Okabe y Kei Ito combinada con doble codificación redundante.',
    'Implementar en SQL columnas de diagnóstico accesible que combinen símbolos, prefijos textuales y umbrales numéricos sobre las tiendas de Mercado Brisa.',
  ],
  sections: [
    {
      id: 'sec-regla-90-10-color-restringido',
      heading: 'Uso restringido del color: la regla 90/10 y la fatiga preatentiva',
      body: 'El color procesado en la corteza visual actúa como un atributo preatentivo. Una barra de acento cálido rodeada de barras grises captura la mirada en menos de 200 milisegundos. Sin embargo, como advierten **Edward Tufte** y **Stephen Few**, pintar cada tienda de un color distinto destruye ese efecto. Si todo grita en la pantalla, nada se escucha.\n\nEl diseño profesional de tableros aplica la **regla 90/10 del color**. El 90 % de la superficie visual se construye con una escala acromática de grises, pizarras o azules desaturados. Esto incluye fondos, ejes, bordes, etiquetas y barras dentro de meta. El 10 % restante reserva el color de acento únicamente para las entidades en alerta.\n\nDe igual forma, nunca usamos diez colores categóricos para codificar una variable continua. Si las barras ya están ordenadas por longitud, colorear cada tienda solo obliga a consultar una leyenda innecesaria.',
    },
    {
      id: 'sec-wcag-22-contraste-luminancia',
      heading: 'Estándar W3C WCAG 2.2: contraste textual (1.4.3) y gráfico (1.4.11)',
      body: 'La legibilidad en monitores, proyectores y pantallas móviles depende de la **razón de contraste de luminancia relativa**. Esta métrica forma parte de las pautas **W3C WCAG 2.2**. Compara la luminancia más clara (`L1`) frente a la más oscura (`L2`) en una escala de `1:1` a `21:1`.\n\nEl nivel de conformidad AA establece tres reglas obligatorias bajo la Pauta 1.4 (*Distinguishable*). Primero, el **Criterio 1.4.3 (Contrast Minimum)** exige una razón mínima de **`4,5:1`** para texto normal y **`3:1`** para texto grande. Las etiquetas de ejes en gris pálido (`#999999` sobre `#FFFFFF`, con razón `2,8:1`) reprueban este umbral. Por ello deben oscurecerse al menos a `#595959` (`7,0:1`).\n\nSegundo, el **Criterio 1.4.11 (Non-text Contrast)** exige una razón mínima de **`3:1`** en objetos gráficos informativos. Esto aplica a barras, líneas de tendencia y marcadores de meta frente a su fondo adyacente.',
      diagram: `flowchart LR
  subgraph WCAG["Umbrales obligatorios W3C WCAG 2.2 Nivel AA en tableros"]
    C1["SC 1.4.1 (Uso del color):<br/>Prohibido usar solo color.<br/>Exige etiqueta, icono o patrón."]
    C2["SC 1.4.3 (Contraste de texto):<br/>Texto normal >= 4,5:1<br/>Texto grande (>=18pt) >= 3:1"]
    C3["SC 1.4.11 (Contraste no textual):<br/>Barras, líneas y controles >= 3:1<br/>contra el fondo adyacente"]
    C1 --> C2 --> C3
  end`,
    },
    {
      id: 'sec-daltonismo-okabe-ito-doble-codificacion',
      heading: 'Daltonismo, paleta de Okabe-Ito y doble codificación redundante',
      body: 'Cerca del **8 % de los hombres** presenta deficiencias en la visión del color rojo-verde. Las formas más comunes son la **deuteranopía** (sensibilidad reducida al verde) y la **protanopía** (sensibilidad reducida al rojo). En un semáforo tradicional con rojo (`#FF0000`) y verde (`#00AA00`) de igual luminancia, ambos tonos se ven como un marrón indistinguible.\n\nLos investigadores **Masataka Okabe** y **Kei Ito** diseñaron la paleta de **Diseño Universal del Color (CUD)**. Esta paleta garantiza distinción perceptual en tricrómatas y dicrómatas por igual. En lugar del par rojo-verde, contrapone azul (`#0072B2`) o azul cielo (`#56B4E9`) frente a naranja (`#E69F00`) o bermellón (`#D55E00`).\n\nPara cumplir además el **Criterio 1.4.1 de WCAG 2.2**, aplicamos la **doble codificación redundante**. Cada estado combina el color con un segundo canal no cromático, como un icono (`● / ◆ / ▲`) o un prefijo textual (`[OK]`, `[WARN]`, `[ALERT]`). Así el tablero conserva todo su significado incluso impreso en blanco y negro.',
      example: {
        language: 'sql',
        code: `WITH reg_orders AS (
  SELECT
    s.region,
    ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.total_usd ELSE 0 END), 2) AS completed_rev_usd,
    COUNT(o.order_id) AS total_orders,
    SUM(CASE WHEN o.status = 'refunded' THEN 1 ELSE 0 END) AS refunded_orders
  FROM orders o
  JOIN stores s ON o.store_id = s.store_id
  WHERE EXTRACT(YEAR FROM o.order_date) = 2024
  GROUP BY s.region
)
SELECT
  region,
  completed_rev_usd,
  total_orders,
  refunded_orders,
  ROUND(refunded_orders * 100.0 / total_orders, 2) AS refund_rate_pct,
  CASE
    WHEN refunded_orders * 100.0 / total_orders >= 8.0 THEN '[ALERTA ▲] Tasa alta (>= 8%)'
    WHEN refunded_orders * 100.0 / total_orders >= 7.5 THEN '[AVISO ◆] En vigilancia (7.5%-8%)'
    ELSE '[NORMAL ●] Dentro de umbral (< 7.5%)'
  END AS status_doble_codificacion
FROM reg_orders
ORDER BY refund_rate_pct DESC;`,
        explanation: 'Esta consulta materializa la doble codificación directamente en la capa de datos: Iberia (8,39 %) y Norteamérica (8,23 %) reciben la etiqueta "[ALERTA ▲] Tasa alta (>= 8%)", Cono Sur (7,81 %) "[AVISO ◆] En vigilancia (7.5%-8%)" y Andina (7,18 %) "[NORMAL ●] Dentro de umbral (< 7.5%)".',
      },
    },
  ],
  workedExample: {
    title: 'Auditoría accesible de cumplimiento anual por tienda en Mercado Brisa (2024)',
    problem: 'Construir una consulta para la tabla inferior del tablero que evalúe el cumplimiento de meta anual (`monthly_target_usd * 12`) de las 14 tiendas en 2024 y genere una columna `accessible_status` con doble codificación textual (`[OK] En meta` para `>= 100 %`, `[WARN] En observacion` para `>= 60 %` y `< 100 %`, y `[ALERT] Critico` para `< 60 %`).',
    steps: [
      {
        label: 'Paso 1: Agregar los ingresos completados de 2024 por store_id',
        sql: `SELECT
  store_id,
  ROUND(SUM(total_usd), 2) AS actual_2024_usd
FROM orders
WHERE status = 'completed'
  AND EXTRACT(YEAR FROM order_date) = 2024
GROUP BY store_id
ORDER BY actual_2024_usd DESC;`,
        explanation: 'Calculamos en el grano de tienda los ingresos completados de 2024 para las 14 tiendas, encabezadas por Tienda Palermo Soho ($495.171,58) y Tienda Miraflores ($387.827,80).',
      },
      {
        label: 'Paso 2: Cruzar con stores y calcular la meta anual y el porcentaje de cumplimiento',
        sql: `WITH store_sales AS (
  SELECT
    store_id,
    ROUND(SUM(total_usd), 2) AS actual_2024_usd
  FROM orders
  WHERE status = 'completed'
    AND EXTRACT(YEAR FROM order_date) = 2024
  GROUP BY store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  ss.actual_2024_usd,
  ROUND(s.monthly_target_usd * 12, 2) AS annual_target_usd,
  ROUND(ss.actual_2024_usd * 100.0 / (s.monthly_target_usd * 12), 1) AS attainment_pct
FROM stores s
JOIN store_sales ss ON s.store_id = ss.store_id
ORDER BY attainment_pct ASC;`,
        explanation: 'Al comparar contra monthly_target_usd * 12, observamos que Tienda Reforma Norte tiene el menor cumplimiento relativo (8,2 %) y Tienda Palermo Soho el mayor (89,7 %).',
      },
      {
        label: 'Paso 3: Añadir la columna de estado con doble codificación accesible (WCAG 1.4.1)',
        sql: `WITH store_sales AS (
  SELECT
    store_id,
    ROUND(SUM(total_usd), 2) AS actual_2024_usd
  FROM orders
  WHERE status = 'completed'
    AND EXTRACT(YEAR FROM order_date) = 2024
  GROUP BY store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  ss.actual_2024_usd,
  ROUND(s.monthly_target_usd * 12, 2) AS annual_target_usd,
  ROUND(ss.actual_2024_usd * 100.0 / (s.monthly_target_usd * 12), 1) AS attainment_pct,
  CASE
    WHEN ss.actual_2024_usd >= (s.monthly_target_usd * 12) THEN '[OK] En meta'
    WHEN ss.actual_2024_usd >= (s.monthly_target_usd * 12) * 0.60 THEN '[WARN] En observacion'
    ELSE '[ALERT] Critico'
  END AS accessible_status
FROM stores s
JOIN store_sales ss ON s.store_id = ss.store_id
ORDER BY attainment_pct ASC;`,
        explanation: 'Doce tiendas quedan clasificadas como "[ALERT] Critico" (< 60 % de la meta anual) y dos tiendas (Tienda Miraflores con 73,5 % y Tienda Palermo Soho con 89,7 %) como "[WARN] En observacion". El prefijo entre corchetes permite distinguir el estado sin depender del color.',
      },
    ],
    takeaway: 'Codificar el prefijo de estado directamente en SQL garantiza que lectores de pantalla, exportaciones a texto y usuarios con daltonismo reciban exactamente la misma señal de alerta que el color.',
  },
  checks: [
    {
      id: 'chk-bi3-03-q1',
      type: 'mcq',
      prompt: 'Según los criterios de conformidad W3C WCAG 2.2 Nivel AA (1.4.3 y 1.4.11), ¿cuáles son las razones mínimas de contraste exigidas para texto normal y para marcas gráficas de datos (barras o líneas)?',
      options: [
        {
          id: 'a',
          text: '2,0:1 para texto normal y 1,5:1 para marcas gráficas.',
          correct: false,
          feedback: 'Incorrecto. Esos valores son insuficientes para personas con baja visión o pantallas con reflejos.',
        },
        {
          id: 'b',
          text: '4,5:1 para texto normal y 3,0:1 para marcas gráficas y componentes de interfaz.',
          correct: true,
          feedback: 'Correcto. El criterio 1.4.3 exige al menos 4,5:1 en texto normal (3:1 en texto grande) y el criterio 1.4.11 exige al menos 3:1 en objetos gráficos contra el fondo adyacente.',
        },
        {
          id: 'c',
          text: '10,0:1 tanto para texto normal como para todas las líneas de cuadrícula decorativas.',
          correct: false,
          feedback: 'Incorrecto. WCAG 2.2 AA no exige 10:1, y las líneas puramente decorativas o bordes inactivos no están sujetos al umbral 3:1.',
        },
        {
          id: 'd',
          text: '3,0:1 para texto normal pequeño y 7,0:1 para los bordes de los gráficos.',
          correct: false,
          feedback: 'Incorrecto. El texto normal requiere mayor contraste (4,5:1) que las formas gráficas sólidas (3,0:1).',
        },
      ],
      explanation: 'WCAG 2.2 Nivel AA fija el estándar de la industria en 4,5:1 para texto normal (SC 1.4.3) y 3:1 para elementos gráficos informativos y controles activos (SC 1.4.11).',
    },
    {
      id: 'chk-bi3-03-q2',
      type: 'mcq',
      prompt: '¿Qué combinación de diseño cumple simultáneamente la guía de Masataka Okabe y Kei Ito para daltonismo y el Criterio 1.4.1 (Uso del color) de WCAG 2.2 al señalar tiendas en estado crítico?',
      options: [
        {
          id: 'a',
          text: 'Pintar las tiendas en meta de verde brillante (#00FF00) y las críticas de rojo puro (#FF0000) sin añadir texto adicional.',
          correct: false,
          feedback: 'Incorrecto. El par rojo-verde es indistinguible en deuteranopía y protanopía, y usar solo color infringe el Criterio 1.4.1.',
        },
        {
          id: 'b',
          text: 'Asignar un color distinto del arcoíris a cada una de las 14 tiendas y explicar los colores en un pie de página.',
          correct: false,
          feedback: 'Incorrecto. Una paleta arcoíris de 14 tonos sobrecarga la memoria de trabajo y no codifica el estado frente al umbral.',
        },
        {
          id: 'c',
          text: 'Mantener las barras dentro de umbral en gris neutro, destacar las críticas en naranja/bermellón (#D55E00) frente a azul (#0072B2) e incluir un prefijo o icono redundante como "[ALERT] ▲".',
          correct: true,
          feedback: 'Correcto. El par azul-bermellón de Okabe-Ito es distinguible bajo deuteranopía y protanopía, la regla 90/10 evita el ruido cromático y el símbolo/prefijo cumple la doble codificación de WCAG 1.4.1.',
        },
        {
          id: 'd',
          text: 'Eliminar todos los colores y etiquetas de estado para mostrar únicamente el identificador numérico store_id.',
          correct: false,
          feedback: 'Incorrecto. Suprimir las señales de umbral oculta la anomalía y obliga al usuario a calcular mentalmente cada porcentaje.',
        },
      ],
      explanation: 'La accesibilidad cromática combina una paleta segura para dicrómatas (azul y naranja/bermellón de distinta luminancia) con doble codificación (símbolo y etiqueta) y moderación cromática (gris para el contexto normal).',
    },
    {
      id: 'chk-bi3-03-q3',
      type: 'fill-code',
      prompt: 'En una consulta SQL que clasifica tiendas según su cumplimiento anual, queremos cumplir el principio de doble codificación devolviendo el prefijo textual `\'[ALERT] Critico\'` en la rama por defecto cuando no se alcancen los umbrales previos. Completa la palabra clave de la cláusula final del CASE:',
      template: "CASE WHEN actual_2024_usd >= annual_target_usd THEN '[OK] En meta' WHEN actual_2024_usd >= annual_target_usd * 0.60 THEN '[WARN] En observacion' __BLANK_1__ '[ALERT] Critico' END",
      blanks: [
        {
          id: 'BLANK_1',
          accepted: ['ELSE', 'else'],
        },
      ],
      explanation: 'La cláusula ELSE captura todas las filas que no superaron el 100 % ni el 60 % de la meta anual, asignándoles la etiqueta explícita con prefijo "[ALERT] Critico".',
    },
  ],
  practice: {
    type: 'sql',
    prompt: 'Construye la consulta de auditoría accesible para las 14 tiendas de Mercado Brisa en 2024. Debes devolver 7 columnas exactas: `store_id`, `store_name`, `region`, `actual_2024_usd` (suma de `total_usd` de pedidos con `status = \'completed\'` en `2024`, redondeada a 2 decimales), `annual_target_usd` (`monthly_target_usd * 12` redondeado a 2 decimales), `attainment_pct` (`actual_2024_usd * 100.0 / (monthly_target_usd * 12)` redondeado a 1 decimal) y `accessible_status` (`\'[OK] En meta\'` si `actual_2024_usd >= monthly_target_usd * 12`, `\'[WARN] En observacion\'` si es `>= (monthly_target_usd * 12) * 0.60`, y `\'[ALERT] Critico\'` en caso contrario). Ordena por `attainment_pct` de menor a mayor (las más críticas primero).',
    starterCode: `WITH store_sales AS (
  SELECT
    store_id,
    -- TODO: suma total_usd redondeado a 2 decimales para pedidos completados de 2024
    0 AS actual_2024_usd
  FROM orders
  -- TODO: filtra status = 'completed' y año 2024
  GROUP BY store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  ss.actual_2024_usd,
  ROUND(s.monthly_target_usd * 12, 2) AS annual_target_usd,
  ROUND(ss.actual_2024_usd * 100.0 / (s.monthly_target_usd * 12), 1) AS attainment_pct,
  -- TODO: construye el CASE para accessible_status con '[OK] En meta', '[WARN] En observacion' y '[ALERT] Critico'
  '' AS accessible_status
FROM stores s
JOIN store_sales ss ON s.store_id = ss.store_id
ORDER BY attainment_pct ASC;`,
    solution: `WITH store_sales AS (
  SELECT
    store_id,
    ROUND(SUM(total_usd), 2) AS actual_2024_usd
  FROM orders
  WHERE status = 'completed'
    AND EXTRACT(YEAR FROM order_date) = 2024
  GROUP BY store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  ss.actual_2024_usd,
  ROUND(s.monthly_target_usd * 12, 2) AS annual_target_usd,
  ROUND(ss.actual_2024_usd * 100.0 / (s.monthly_target_usd * 12), 1) AS attainment_pct,
  CASE
    WHEN ss.actual_2024_usd >= (s.monthly_target_usd * 12) THEN '[OK] En meta'
    WHEN ss.actual_2024_usd >= (s.monthly_target_usd * 12) * 0.60 THEN '[WARN] En observacion'
    ELSE '[ALERT] Critico'
  END AS accessible_status
FROM stores s
JOIN store_sales ss ON s.store_id = ss.store_id
ORDER BY attainment_pct ASC;`,
    expected: `WITH store_sales AS (
  SELECT
    store_id,
    ROUND(SUM(total_usd), 2) AS actual_2024_usd
  FROM orders
  WHERE status = 'completed'
    AND EXTRACT(YEAR FROM order_date) = 2024
  GROUP BY store_id
)
SELECT
  s.store_id,
  s.store_name,
  s.region,
  ss.actual_2024_usd,
  ROUND(s.monthly_target_usd * 12, 2) AS annual_target_usd,
  ROUND(ss.actual_2024_usd * 100.0 / (s.monthly_target_usd * 12), 1) AS attainment_pct,
  CASE
    WHEN ss.actual_2024_usd >= (s.monthly_target_usd * 12) THEN '[OK] En meta'
    WHEN ss.actual_2024_usd >= (s.monthly_target_usd * 12) * 0.60 THEN '[WARN] En observacion'
    ELSE '[ALERT] Critico'
  END AS accessible_status
FROM stores s
JOIN store_sales ss ON s.store_id = ss.store_id
ORDER BY attainment_pct ASC;`,
    solutionExplanation: 'La consulta preagrega las ventas completadas de 2024 por store_id y las compara contra la cuota anual (monthly_target_usd * 12). Al ordenar de menor a mayor cumplimiento, expone primero las tiendas críticas encabezadas por Tienda Reforma Norte (8,2 %, "[ALERT] Critico") y al final Tienda Miraflores (73,5 %) y Tienda Palermo Soho (89,7 %) con "[WARN] En observacion".',
    orderMatters: true,
    hints: [
      'En store_sales filtra WHERE status = \'completed\' AND EXTRACT(YEAR FROM order_date) = 2024 y agrupa por store_id.',
      'En el CASE evalúa primero ss.actual_2024_usd >= (s.monthly_target_usd * 12) para \'[OK] En meta\' y luego >= (s.monthly_target_usd * 12) * 0.60 para \'[WARN] En observacion\'.',
      'Cierra el CASE con ELSE \'[ALERT] Critico\' END AS accessible_status y mantén ORDER BY attainment_pct ASC.',
    ],
  },
  roleNotes: {
    de: 'Incluye columnas de código de estado y etiquetas estandarizadas en las vistas de monitoreo para que las alertas no dependan de reglas de formato condicional reconstruidas manualmente en cada reporte.',
    da: 'Verifica siempre tus paletas con un simulador de deuteranopía y un comprobador de contraste WCAG; si un gráfico pierde su mensaje al pasarlo a escala de grises, añade etiquetas directas o símbolos.',
    bi: 'Configura en el archivo de tema JSON de Power BI o herramienta corporativa una paleta predeterminada basada en grises neutros y pares azul/naranja de Okabe-Ito con contraste >= 4,5:1 en textos.',
  },
  summary: [
    'La regla 90/10 reserva el color saturado exclusivamente para señalar anomalías, manteniendo el contexto en tonos neutros.',
    'El estándar W3C WCAG 2.2 Nivel AA exige un contraste mínimo de 4,5:1 para texto normal y de 3:1 para marcas gráficas.',
    'La paleta de Okabe-Ito sustituye el semáforo rojo-verde por pares como azul (#0072B2) y naranja/bermellón (#D55E00), seguros para daltonismo.',
    'La doble codificación redundante acompaña el color con prefijos textuales, signos o iconos para cumplir el Criterio WCAG 1.4.1.',
  ],
  flashcards: [
    {
      id: 'fc-bi3-03-1',
      front: '¿En qué consiste la regla 90/10 del color en el diseño de tableros?',
      back: 'En construir el 90 % de los elementos de contexto con tonos neutros (grises o desaturados) y reservar el 10 % de color saturado exclusivamente para alertas o datos que requieren acción.',
    },
    {
      id: 'fc-bi3-03-2',
      front: '¿Qué umbrales de contraste exigen los criterios 1.4.3 y 1.4.11 de W3C WCAG 2.2 Nivel AA?',
      back: 'Al menos 4,5:1 para texto normal (3:1 para texto grande >= 18pt o >= 14pt negrita) bajo SC 1.4.3, y al menos 3:1 para objetos gráficos y controles activos bajo SC 1.4.11.',
    },
    {
      id: 'fc-bi3-03-3',
      front: '¿Por qué debe evitarse el semáforo rojo-verde y qué alternativa proponen Masataka Okabe y Kei Ito?',
      back: 'Porque cerca del 8 % de los hombres padece deuteranopía o protanopía y confunde rojo y verde de igual luminancia; Okabe e Ito proponen combinar azul (#0072B2) y naranja/bermellón (#D55E00).',
    },
    {
      id: 'fc-bi3-03-4',
      front: '¿Qué exige el Criterio 1.4.1 (Use of Color) de WCAG 2.2 en una tabla o gráfico de estados?',
      back: 'Que el color nunca sea el único medio visual para transmitir información; debe acompañarse de doble codificación como etiquetas textuales ("[ALERT]"), signos (+/-) o iconos (▲/●).',
    },
  ],
  sources: [
    {
      title: 'Understanding Success Criterion 1.4.1: Use of Color (WCAG 2.2)',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',
      publisher: 'W3C Web Accessibility Initiative',
      accessed: '2026-10-29',
      supports: 'Requisito normativo de no usar el color como único canal visual y aplicar codificación redundante.',
    },
    {
      title: 'Understanding Success Criterion 1.4.3: Contrast (Minimum) (WCAG 2.2)',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
      publisher: 'W3C Web Accessibility Initiative',
      accessed: '2026-10-29',
      supports: 'Fórmula de luminancia relativa y umbrales mínimos de contraste 4,5:1 para texto normal y 3:1 para texto grande.',
    },
    {
      title: 'Understanding Success Criterion 1.4.11: Non-text Contrast (WCAG 2.2)',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
      publisher: 'W3C Web Accessibility Initiative',
      accessed: '2026-10-29',
      supports: 'Umbral mínimo de contraste 3:1 para barras, líneas y componentes gráficos frente al fondo adyacente.',
    },
    {
      title: 'Color Universal Design (CUD): How to make figures and presentations that are friendly to Colorblind people',
      url: 'https://jfly.uni-koeln.de/color/',
      publisher: 'Masataka Okabe & Kei Ito',
      accessed: '2026-10-29',
      supports: 'Fundamentos fisiológicos del daltonismo rojo-verde y paleta universal de ocho colores distinguibles.',
    },
    {
      title: 'Design Power BI reports for accessibility',
      url: 'https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports',
      publisher: 'Microsoft Learn',
      accessed: '2026-10-29',
      supports: 'Prácticas de accesibilidad en reportes empresariales: contraste, iconos condicionales, orden de tabulación y texto alternativo.',
    },
  ],
  aiNotes: 'Verifica que el estudiante utilice las cadenas exactas \'[OK] En meta\', \'[WARN] En observacion\' y \'[ALERT] Critico\' en la cláusula CASE y que ordene de menor a mayor cumplimiento (ORDER BY attainment_pct ASC), donde Tienda Reforma Norte aparece primera con 8,2 %.',
};

export default lesson;
