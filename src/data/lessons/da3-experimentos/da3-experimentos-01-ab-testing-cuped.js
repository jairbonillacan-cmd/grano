// Lección migrada al esquema v2 mediante scripts/migrate-legacy.mjs
const lesson = {
  "id": "da3-experimentos-01-ab-testing-cuped",
  "moduleId": "da3-experimentos",
  "tracks": [
    "da"
  ],
  "level": 3,
  "order": 1,
  "title": "Pruebas A/B, diagnóstico SRM y reducción de varianza CUPED",
  "minutes": 30,
  "prerequisites": [
    "da2-inferencia-05"
  ],
  "contentVersion": 1,
  "hook": "En Mercado Brisa (empresa ficticia), producto lanza un pago rápido (variante B) asignando 50 % a control y 50 % a tratamiento. Al tercer día ven que el gasto medio en B es 25.20 USD frente a 24.10 USD en A y piden desplegarlo ya. Al auditar encuentras 50 100 usuarios en A y 47 200 en B, sin tamaño muestral previo. ¿Por qué debes frenar el despliegue y cómo operan SRM y CUPED?",
  "objectives": [
    "Ejecutar una prueba chi-cuadrado de bondad de ajuste para detectar Sample Ratio Mismatch (SRM) antes de mirar métricas.",
    "Evitar la inflación de falsos positivos por inspección repetida (peeking) calculando tamaño de muestra o fronteras secuenciales.",
    "Aplicar reducción de varianza CUPED en SQL usando el comportamiento pre-experimental como covariable."
  ],
  "sections": [
    {
      "id": "diagnostico-previo-al-analisis-prueba-chi-cuadra",
      "heading": "Diagnóstico previo al análisis: prueba chi-cuadrado para SRM",
      "body": "Antes de mirar si la conversión o los ingresos subieron, debes auditar si el tráfico se repartió exactamente como fue diseñado. Si configuraste una división **50% / 50%** sobre `100,000` usuarios expuestos, la fluctuación normal del azar permite ver `50,150` vs. `49,850`. Pero si observas `51,850` en Control y `48,150` en Tratamiento, una prueba Chi-cuadrado de bondad de ajuste arrojará un valor `p < 0.0001`.\nEso se denomina **Sample Ratio Mismatch (SRM)** y significa que existe un fallo técnico grave que invalida el experimento: por ejemplo, el nuevo código de la Variante B crashea en teléfonos Android antiguos antes de disparar el evento de exposición, o una redirección lenta hace que los usuarios impacientes cierren la pestaña. Como los usuarios que se pierden en B no son aleatorios, cualquier comparación de métricas está irremediablemente sesgada. **Regla de oro: si hay SRM (`p_srm < 0.001`), se descarta el análisis y DE corrige la instrumentación.**",
      "interactive": {
        "component": "ab-test-cuped-simulator",
        "caption": "Simulador interactivo: Pruebas A/B, diagnóstico SRM y reducción de varianza CUPED"
      }
    },
    {
      "id": "potencia-estadistica-mde-y-error-por-inspeccion-",
      "heading": "Potencia estadística, MDE y error por inspección prematura",
      "body": "Diseñar un experimento requiere fijar de antemano tres parámetros:\n1) Nivel de significancia (`α = 0.05`, probabilidad máxima de Falso Positivo o Error Tipo I).\n2) Potencia estadística (`1 - β = 0.80`, probabilidad de detectar un efecto real si existe, evitando el Error Tipo II).\n3) Efecto Mínimo Detectable (`MDE`, el cambio más pequeño que vale la pena para el negocio, ej. `+0.4%` en conversión).\nEl error más destructivo en equipos sin disciplina estadística es el **Peeking** (mirar el p-valor todos los días y detener el test en cuanto cruza `p < 0.05`). Con un test frecuentista de horizonte fijo, revisar diariamente durante 14 días infla tu tasa de falsos positivos del **5% a más del 26%**. Si necesitas monitorear resultados continuamente para abortar caídas graves, debes utilizar **Tests Secuenciales Siempre Válidos (mSPRT)** con fronteras ajustadas.",
      "example": {
        "language": "sql",
        "code": "WITH cuped_theta AS (\n  SELECT\n    COVAR_SAMP(post_revenue_usd, pre_revenue_14d_usd)\n      / NULLIF(VAR_SAMP(pre_revenue_14d_usd), 0) AS theta,\n    AVG(pre_revenue_14d_usd) AS mean_pre_global\n  FROM exp_checkout_users\n),\nuser_adjusted AS (\n  SELECT\n    u.variant,\n    u.post_revenue_usd AS y_raw,\n    u.post_revenue_usd - t.theta * (u.pre_revenue_14d_usd - t.mean_pre_global) AS y_cuped\n  FROM exp_checkout_users u\n  CROSS JOIN cuped_theta t\n)\nSELECT\n  variant,\n  COUNT(*) AS n_exposed_users,\n  ROUND(AVG(y_cuped), 2) AS mean_cuped_usd,\n  ROUND(STDDEV_SAMP(y_raw) / SQRT(COUNT(*)), 3) AS se_raw_usd,\n  ROUND(STDDEV_SAMP(y_cuped) / SQRT(COUNT(*)), 3) AS se_cuped_usd\nFROM user_adjusted\nGROUP BY variant\nORDER BY variant;",
        "expectedOutput": [
          {
            "variant": "Control (A)",
            "n_exposed_users": "50,042 (SRM p = 0.79 OK)",
            "mean_cuped_usd": "$24.35",
            "se_raw_usd": "±$0.480",
            "se_cuped_usd": "±$0.265 (-45% Error Estándar)"
          },
          {
            "variant": "Tratamiento (B)",
            "n_exposed_users": "49,958 (SRM p = 0.79 OK)",
            "mean_cuped_usd": "$25.12 (+$0.77 Lift)",
            "se_raw_usd": "±$0.492",
            "se_cuped_usd": "±$0.270 (IC 95%: [+$0.24, +$1.30] · p = 0.004)"
          }
        ]
      }
    },
    {
      "id": "reduccion-de-varianza-mediante-covariables-preex",
      "heading": "Reducción de varianza mediante covariables preexperimentales (CUPED)",
      "body": "En métricas continuas como `ingreso_por_usuario`, la varianza natural entre usuarios (clientes que gastan $500 vs. usuarios que gastan $5) es enorme y ensancha el Intervalo de Confianza, obligándote a esperar semanas para acumular millones de usuarios.\n**CUPED (Controlled-experiment Using Pre-Experiment Data)** aprovecha un hecho brillante: el gasto de un usuario en los **14 días previos al experimento (`X_pre`)** está fuertemente correlacionado con su gasto durante el experimento (`Y`), pero es **100% independiente del tratamiento** porque ocurrió antes de la asignación.\nCalculamos la métrica ajustada para cada usuario:\n`Y_cuped = Y - θ * (X_pre - media_global(X_pre))`, donde `θ = Cov(Y, X_pre) / Var(X_pre)`.\nComo `media(X_pre)` es estadísticamente idéntica en Control y Tratamiento gracias a la aleatorización, el estimador del efecto (`Lift`) permanece **completamente insesgado**, pero su varianza se reduce en una proporción `1 - r²` (donde `r` es la correlación entre `X_pre` e `Y`). Con `r = 0.75`, CUPED reduce la varianza un **56%**, lo que equivale a **más que duplicar el tráfico de tu empresa gratis**."
    },
    {
      "id": "metricas-de-control-efecto-novedad-y-linealizaci",
      "heading": "Métricas de control, efecto novedad y linealización de razones",
      "body": "Ningún experimento se aprueba mirando una sola métrica aislada. Si un botón gigante aumenta los clics un `+4%` (Métrica Primaria / OEC), pero aumenta los reembolsos o la latencia del servidor un `+30%`, el cambio destruye valor. Por eso definimos **Métricas Guardia (Guardrails)**: latencia p95, tasa de errores, cancelaciones y tickets de soporte que no deben deteriorarse.\nAdemás, cuando la métrica es un ratio donde la unidad de aleatorización es el `usuario` pero el denominador son las `sesiones` (ej. ingreso por sesión), las sesiones de un mismo usuario no son independientes: DE y DA deben agregar primero a nivel de `user_id` o aplicar el **Método Delta / Linearización** para no subestimar el error estándar."
    }
  ],
  "workedExample": {
    "title": "Ejemplo guiado: Pruebas A/B, diagnóstico SRM y reducción de varianza CUPED",
    "description": "Compara el análisis ingenuo de un test A/B (que ignora SRM, error estándar y varianza pre-existente) frente al pipeline SQL con ajuste CUPED:",
    "audit": "",
    "steps": [
      {
        "label": "Antipatrón: comparar promedios crudos con inspección temprana",
        "explanation": "Compara el análisis ingenuo de un test A/B (que ignora SRM, error estándar y varianza pre-existente) frente al pipeline SQL con ajuste CUPED:",
        "code": "-- PELIGROSO:\n-- 1) No revisa si los tamaños muestrales sufren Sample Ratio Mismatch (SRM)\n-- 2) No calcula el Error Estándar ni el Intervalo de Confianza al 95%\n-- 3) No ajusta por la varianza pre-experimento (ballenas desbalanceadas entre ramas)\nSELECT\n  variant,\n  AVG(post_revenue_usd) AS ingreso_promedio_crudo\nFROM exp_checkout_users\nGROUP BY variant;",
        "expectedOutput": [
          {
            "variant": "Control (A)",
            "ingreso_promedio_crudo": "$24.10 (Sin intervalo de confianza ni validación SRM)"
          },
          {
            "variant": "Tratamiento (B)",
            "ingreso_promedio_crudo": "$25.20 (Peligro. Sin CUPED el IC 95% es [-$0.18, +$1.72], cruza cero)"
          }
        ]
      },
      {
        "label": "Solución óptima: auditoría de muestra y ajuste CUPED en SQL",
        "explanation": "Compara ahora la consulta corregida y verifica cómo las filas y totales coinciden con la auditoría.",
        "code": "WITH cuped_theta AS (\n  SELECT\n    COVAR_SAMP(post_revenue_usd, pre_revenue_14d_usd)\n      / NULLIF(VAR_SAMP(pre_revenue_14d_usd), 0) AS theta,\n    AVG(pre_revenue_14d_usd) AS mean_pre_global\n  FROM exp_checkout_users\n),\nuser_adjusted AS (\n  SELECT\n    u.variant,\n    u.post_revenue_usd AS y_raw,\n    u.post_revenue_usd - t.theta * (u.pre_revenue_14d_usd - t.mean_pre_global) AS y_cuped\n  FROM exp_checkout_users u\n  CROSS JOIN cuped_theta t\n)\nSELECT\n  variant,\n  COUNT(*) AS n_exposed_users,\n  ROUND(AVG(y_cuped), 2) AS mean_cuped_usd,\n  ROUND(STDDEV_SAMP(y_raw) / SQRT(COUNT(*)), 3) AS se_raw_usd,\n  ROUND(STDDEV_SAMP(y_cuped) / SQRT(COUNT(*)), 3) AS se_cuped_usd\nFROM user_adjusted\nGROUP BY variant\nORDER BY variant;",
        "expectedOutput": [
          {
            "variant": "Control (A)",
            "n_exposed_users": "50,042 (SRM p = 0.79 OK)",
            "mean_cuped_usd": "$24.35",
            "se_raw_usd": "±$0.480",
            "se_cuped_usd": "±$0.265 (-45% Error Estándar)"
          },
          {
            "variant": "Tratamiento (B)",
            "n_exposed_users": "49,958 (SRM p = 0.79 OK)",
            "mean_cuped_usd": "$25.12 (+$0.77 Lift)",
            "se_raw_usd": "±$0.492",
            "se_cuped_usd": "±$0.270 (IC 95%: [+$0.24, +$1.30] · p = 0.004)"
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "c1",
      "type": "mcq",
      "prompt": "Lanzas un experimento A/B con asignación teórica 50% Control / 50% Tratamiento sobre 200,000 usuarios. Al revisar la tabla de exposiciones observas 103,400 usuarios en Control (51.7%) y 96,600 en Tratamiento (48.3%), con un p-valor de SRM de `0.000001`. Sin embargo, la conversión de los usuarios en Tratamiento parece un +6% mayor. ¿Qué decisión debes tomar?",
      "options": [
        {
          "id": "a",
          "text": "Declarar el experimento inválido de inmediato por Sample Ratio Mismatch (SRM) y pedir a Ingeniería (DE) investigar qué bug técnico está perdiendo el 3.4% de los usuarios en Tratamiento antes de mirar cualquier métrica de conversión.",
          "correct": true,
          "feedback": "Exacto. Un SRM severo demuestra que faltan miles de usuarios en una rama de forma no aleatoria (por ejemplo, usuarios con conexiones lentas donde el nuevo código falló al cargar). Como solo sobrevivieron los usuarios con mejores dispositivos en Tratamiento, el +6% de conversión es un espejismo por sesgo de supervivencia."
        },
        {
          "id": "b",
          "text": "Lanzar la variante de Tratamiento a producción porque +6% es un aumento muy grande y 96,600 usuarios ya son suficientes.",
          "correct": false,
          "feedback": "Cuando hay SRM, los dos grupos dejaron de ser comparables. Tener muchos usuarios no corrige un sesgo de selección en la asignación."
        },
        {
          "id": "c",
          "text": "Borrar al azar 6,800 usuarios del grupo Control en SQL para que ambos grupos queden en 96,600 y dar por válido el experimento.",
          "correct": false,
          "feedback": "Borrar usuarios aleatorios de Control no recupera a los usuarios específicos (ej. móviles lentos o un navegador concreto) que se perdieron sistemáticamente en Tratamiento."
        }
      ],
      "explanation": "Exacto. Un SRM severo demuestra que faltan miles de usuarios en una rama de forma no aleatoria (por ejemplo, usuarios con conexiones lentas donde el nuevo código falló al cargar). Como solo sobrevivieron los usuarios con mejores dispositivos en Tratamiento, el +6% de conversión es un espejismo por sesgo de supervivencia."
    },
    {
      "id": "c2",
      "type": "mcq",
      "prompt": "Diseñas un experimento 50/50 y tras una semana observas 100 000 usuarios en Control y 96 500 en Tratamiento (p-valor de chi-cuadrado = 0.00001). Sin embargo, el ingreso por usuario en Tratamiento parece un 4 % mayor. ¿Qué decisión debes tomar?",
      "options": [
        {
          "id": "a",
          "text": "Invalidar el análisis causal, declarar alerta de SRM y buscar el bug técnico (por ejemplo, fallos de carga en navegadores lentos de la rama B).",
          "correct": true,
          "feedback": "Correcto: con SRM confirmado, las dos ramas ya no son comparables porque faltan selectivamente ciertos perfiles de usuarios."
        },
        {
          "id": "b",
          "text": "Ignorar la diferencia de conteos porque el ingreso por usuario divide entre N y corrige el tamaño de muestra.",
          "correct": false,
          "feedback": "Incorrecto: si los usuarios que se perdieron en B eran los de conexiones más lentas o menor gasto, el promedio de los que quedan queda sesgado al alza."
        },
        {
          "id": "c",
          "text": "Borrar al azar 3 500 usuarios de Control para igualar los conteos.",
          "correct": false,
          "feedback": "Incorrecto: eliminar usuarios al azar en Control no corrige el sesgo de selección no aleatorio que ocurrió en Tratamiento."
        }
      ],
      "explanation": "Un fallo de SRM demuestra que el mecanismo de aleatorización o captura perdió sujetos de manera asimétrica, rompiendo el supuesto de independencia del experimento."
    },
    {
      "id": "c3",
      "type": "mcq",
      "prompt": "Quieres aplicar CUPED sobre el gasto durante los 14 días del experimento ($Y$). ¿Cuál de las siguientes variables es una covariable $X$ válida?",
      "options": [
        {
          "id": "a",
          "text": "El gasto del mismo usuario durante los 14 días inmediatamente anteriores al inicio del experimento.",
          "correct": true,
          "feedback": "Correcto: al haberse registrado antes de asignar la variante, tiene alta correlación con Y y su media poblacional es idéntica entre ramas."
        },
        {
          "id": "b",
          "text": "El número de sesiones del usuario durante la semana del experimento.",
          "correct": false,
          "feedback": "Incorrecto: las sesiones durante el experimento pueden verse afectadas por la variante B; usarlas como covariable distorsiona el efecto."
        },
        {
          "id": "c",
          "text": "Un número aleatorio generado en el momento de la consulta.",
          "correct": false,
          "feedback": "Incorrecto: una variable con correlación r = 0 con Y produce (1 - r²) = 1 y no reduce nada la varianza."
        }
      ],
      "explanation": "La eficacia de CUPED proviene de elegir la misma métrica medida en la ventana inmediata previa a la aleatorización, donde la correlación con el resultado es máxima."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Reducción de varianza experimental con CUPED",
    "language": "sql",
    "prompt": "Aplica el ajuste CUPED sobre `experiment_assignments` para el experimento `experiment_id = 1`: calcula `theta` (`COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd) / VAR_SAMP(pre_experiment_spend_usd)`), la métrica ajustada `y_cuped` y devuelve por `variant`: `usuarios`, `media_ajustada_usd` y `error_estandar_cuped`.",
    "starterCode": "WITH stats_global AS (\n  SELECT\n    -- TODO: Calcula theta como COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd) / NULLIF(VAR_SAMP(pre_experiment_spend_usd), 0)\n    0.0 AS theta,\n    AVG(pre_experiment_spend_usd) AS mean_pre\n  FROM experiment_assignments\n  WHERE experiment_id = 1\n),\ncuped_users AS (\n  SELECT\n    u.variant,\n    u.post_experiment_spend_usd - s.theta * (u.pre_experiment_spend_usd - s.mean_pre) AS y_cuped\n  FROM experiment_assignments u\n  CROSS JOIN stats_global s\n  WHERE u.experiment_id = 1\n)\nSELECT\n  variant,\n  COUNT(*) AS usuarios,\n  ROUND(AVG(y_cuped), 2) AS media_ajustada_usd,\n  ROUND(STDDEV_SAMP(y_cuped) / SQRT(COUNT(*)), 3) AS error_estandar_cuped\nFROM cuped_users\nGROUP BY variant\nORDER BY variant;",
    "expected": "WITH stats_global AS (\n  SELECT\n    COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd)\n      / NULLIF(VAR_SAMP(pre_experiment_spend_usd), 0) AS theta,\n    AVG(pre_experiment_spend_usd) AS mean_pre\n  FROM experiment_assignments\n  WHERE experiment_id = 1\n),\ncuped_users AS (\n  SELECT\n    u.variant,\n    u.post_experiment_spend_usd - s.theta * (u.pre_experiment_spend_usd - s.mean_pre) AS y_cuped\n  FROM experiment_assignments u\n  CROSS JOIN stats_global s\n  WHERE u.experiment_id = 1\n)\nSELECT\n  variant,\n  COUNT(*) AS usuarios,\n  ROUND(AVG(y_cuped), 2) AS media_ajustada_usd,\n  ROUND(STDDEV_SAMP(y_cuped) / SQRT(COUNT(*)), 3) AS error_estandar_cuped\nFROM cuped_users\nGROUP BY variant\nORDER BY variant;",
    "orderMatters": true,
    "hints": [
      "En `stats_global`, reemplaza `0.0 AS theta` por `COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd) / NULLIF(VAR_SAMP(pre_experiment_spend_usd), 0) AS theta`.",
      "La covariable `pre_experiment_spend_usd` fue medida antes de la asignación y reduce sustancialmente el error estándar.",
      "Mantén `ORDER BY variant` para mostrar `control` y `treatment` en orden determinista."
    ],
    "solution": "WITH stats_global AS (\n  SELECT\n    COVAR_SAMP(post_experiment_spend_usd, pre_experiment_spend_usd)\n      / NULLIF(VAR_SAMP(pre_experiment_spend_usd), 0) AS theta,\n    AVG(pre_experiment_spend_usd) AS mean_pre\n  FROM experiment_assignments\n  WHERE experiment_id = 1\n),\ncuped_users AS (\n  SELECT\n    u.variant,\n    u.post_experiment_spend_usd - s.theta * (u.pre_experiment_spend_usd - s.mean_pre) AS y_cuped\n  FROM experiment_assignments u\n  CROSS JOIN stats_global s\n  WHERE u.experiment_id = 1\n)\nSELECT\n  variant,\n  COUNT(*) AS usuarios,\n  ROUND(AVG(y_cuped), 2) AS media_ajustada_usd,\n  ROUND(STDDEV_SAMP(y_cuped) / SQRT(COUNT(*)), 3) AS error_estandar_cuped\nFROM cuped_users\nGROUP BY variant\nORDER BY variant;",
    "solutionExplanation": "Calcula el coeficiente `theta` pooled sobre los usuarios del experimento `experiment_id = 1` y resta `theta * (pre - mean_pre)` a `post_experiment_spend_usd`, reduciendo el error estándar sin sesgar el efecto del tratamiento."
  },
  "roleNotes": {
    "de": "Implementa asignación determinista sin estado mediante hashing rápido (`MurmurHash3(user_id || experiment_salt) % 10000`) para que el usuario vea siempre la misma variante en web y móvil. Registra el evento inmutable de primera exposición (`first_exposed_at`) y construye un pipeline automatizado que congela las covariables pre-experimento (`pre_14d_revenue`, `pre_14d_sessions`) estrictamente antes de ese milisegundo.",
    "da": "Calcula el tamaño muestral requerido según la varianza histórica y el MDE antes de encender el experimento. Aplica el ajuste CUPED (`Y - θ(X - μ_X)`), calcula intervalos de confianza al 95% y aplica correcciones de pruebas múltiples (Benjamini-Hochberg / Holm) cuando hay varias ramas. Audita efectos heterogéneos por segmento (nuevos vs. recurrentes, iOS vs. Android) para descartar efectos de novedad o regresiones ocultas.",
    "bi": "Diseña el Scorecard Oficial de Experimentación mostrando siempre el Intervalo de Confianza al 95% (`[LI, LS]`) en lugar de porcentajes puntuales engañosos. Bloquea visualmente las conclusiones en el dashboard si el experimento aún no ha alcanzado el tamaño muestral comprometido o si la alerta de SRM está activa. Presenta las Métricas Primarias junto al panel semafórico de Métricas Guardia (latencia, reembolsos, churn) para decisiones ejecutivas Go / No-Go."
  },
  "summary": [
    "Si la proporción real de usuarios entre ramas difiere de la esperada (SRM), el experimento es inválido.",
    "Detener un test en cuanto p < 0.05 por primera vez multiplica la tasa de falsos positivos.",
    "CUPED resta la parte del resultado explicada por la métrica pre-experimento sin sesgar el efecto medio.",
    "Reducir la varianza con una covariable correlacionada acorta la duración necesaria del experimento."
  ],
  "flashcards": [
    {
      "id": "fc-da3-ab-01",
      "front": "¿Qué indica un p-valor < 0.001 en una prueba de Sample Ratio Mismatch (SRM)?",
      "back": "Que la asignación o el registro de telemetría entre Control y Tratamiento está sesgado; las métricas del experimento no deben interpretarse."
    },
    {
      "id": "fc-da3-ab-02",
      "front": "¿Qué requisito debe cumplir la covariable X en CUPED para no introducir sesgo en la estimación del tratamiento?",
      "back": "Debe medirse estrictamente ANTES de la asignación al experimento (o ser completamente independiente del tratamiento) para que E[X_B] = E[X_A]."
    },
    {
      "id": "fc-da3-ab-03",
      "front": "¿Cuánto se reduce la varianza de Y_cuped si la correlación entre la métrica pre y post experimento es r = 0.8?",
      "back": "La varianza se multiplica por (1 - r²) = (1 - 0.64) = 0.36, es decir, una reducción del 64 % en la varianza (y en el tamaño muestral requerido)."
    }
  ],
  "glossaryTerms": [
    "c23-srm-ab-testing",
    "c24-cuped-variance"
  ],
  "sources": [
    {
      "title": "Deng, Xu, Kohavi & Walker (WSDM 2013) — Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data (CUPED)",
      "url": "https://exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf",
      "publisher": "Microsoft Research / Experimentation Platform",
      "accessed": "2026-10-29",
      "supports": "Derivación matemática del estimador CUPED y factor de reducción de varianza (1 - r²)."
    },
    {
      "title": "Fabijan et al. (KDD 2019) — Diagnosing Sample Ratio Mismatch in Online Controlled Experiments",
      "url": "https://exp-platform.com/srm/",
      "publisher": "Experimentation Platform",
      "accessed": "2026-10-29",
      "supports": "Taxonomía de causas técnicas de Sample Ratio Mismatch y protocolo de diagnóstico con chi-cuadrado."
    },
    {
      "title": "Statsig Documentation — CUPED Variance Reduction and Sequential Testing",
      "url": "https://docs.statsig.com/stats-engine/methodologies/cuped",
      "publisher": "Statsig",
      "accessed": "2026-10-29",
      "supports": "Aplicación práctica de ajuste por covariables pre-experimentales y control de falsos positivos."
    }
  ],
  "aiNotes": "Recalca los dos errores graves en pruebas A/B: mirar el p-valor cada mañana para detener el test cuando baja de 0.05 (peeking) y usar una covariable medida después del inicio del test en CUPED.",
  "needsReview": true,
  "legacyId": "l14-ab-testing-cuped",
  "legacyOrder": 14,
  "stageId": "stage-5",
  "subtitle": "Control de sesgos de asignación y uso de covariables previas para reducir la varianza experimental.",
  "goal": "Auditar la validez de un test A/B mediante Sample Ratio Mismatch (SRM), evitar falsos positivos por Peeking, proteger métricas guardia y aplicar reducción de varianza CUPED en SQL.",
  "pipelineChallenge": {
    "title": "Flujo de experimentación A/B con CUPED",
    "scenario": "Ordena la secuencia correcta de pasos técnicos y estadísticos entre DE, DA y BI para ejecutar y evaluar un experimento A/B sin sesgos post-tratamiento ni falsos positivos.",
    "steps": [
      {
        "id": "step-1",
        "label": "1. Asignación determinista con MurmurHash3 y congelamiento de covariables preexperimento",
        "role": "DE",
        "detail": "Asignar variantes sin estado con `hash(user_id + salt)` y guardar la foto inmutable de métricas de los 14 días previos al primer evento de exposición."
      },
      {
        "id": "step-2",
        "label": "2. Auditoría automática de proporción muestral (SRM chi-cuadrado)",
        "role": "DE",
        "detail": "Verificar que la proporción real de usuarios expuestos en Control vs. Tratamiento no se desvíe significativamente del 50/50 esperado (`p_srm >= 0.001`)."
      },
      {
        "id": "step-3",
        "label": "3. Reducción de varianza CUPED y evaluación de intervalos de confianza",
        "role": "DA",
        "detail": "Aplicar `Y_cuped = Y - θ(X_pre - μ_X)` una vez alcanzado el tamaño muestral y evaluar significancia en la métrica primaria y en los Guardrails."
      },
      {
        "id": "step-4",
        "label": "4. Publicación en el tablero de experimentación para decisión ejecutiva",
        "role": "BI",
        "detail": "Exponer el Lift ajustado con su barra de Intervalo de Confianza al 95%, el estado verde de SRM y el cumplimiento de todas las métricas guardia."
      }
    ],
    "explanation": "Si se salta el congelamiento pre-exposición o el chequeo de SRM antes de calcular el Lift, se corre el riesgo de aprobar cambios rotos técnicamente o sesgados por variables afectadas por el propio tratamiento."
  },
  "relatedLessons": [
    {
      "id": "l6-metrics-simpson",
      "reason": "Si un experimento no está estratificado o sufre SRM en un dispositivo, la Paradoja de Simpson puede invertir el ganador aparente."
    },
    {
      "id": "l13-cohorts-retention-ltv",
      "reason": "Las pruebas A/B sobre onboarding y precios se evalúan midiendo el impacto causal sobre las curvas de retención M1/M3 de la cohorte expuesta."
    },
    {
      "id": "l15-bi-tufte-code",
      "reason": "Aprende a representar intervalos de confianza, metas y métricas guardia con máxima claridad visual sin ruido gráfico."
    }
  ]
};

export default lesson;
