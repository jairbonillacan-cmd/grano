export const lesson = {
  "id": "x4-ia-datos-03-rag-hibrido-bm25-hnsw-rrf",
  "moduleId": "x4-ia-datos",
  "tracks": [
    "core",
    "de",
    "da",
    "bi"
  ],
  "order": 3,
  "contentVersion": 2,
  "title": "RAG híbrido: BM25, vectores HNSW y Reciprocal Rank Fusion",
  "subtitle": "RAG híbrido sobre esquemas y documentos: BM25 + vectores HNSW con Reciprocal Rank Fusion",
  "level": 4,
  "minutes": 25,
  "prerequisites": [
    "x4-ia-datos-02-text-to-sql-capa-semantica"
  ],
  "hook": "Una organización con trescientas vistas semánticas y cientos de productos conecta un buscador vectorial puro a su servidor MCP. Cuando una usuaria pregunta por artículos de baja cafeína en zonas altas, el índice vectorial encuentra Descafeinado de altura con facilidad; pero cuando busca el código exacto MB-CAF-156 o la columna idempotency_key, devuelve resultados irrelevantes. ¿Cómo combinamos búsqueda léxica BM25 y grafos vectoriales HNSW mediante Reciprocal Rank Fusion en SQL sin calibrar umbrales frágiles?",
  "objectives": [
    "Contrastar las fortalezas matemáticas de la búsqueda léxica Okapi BM25 frente a la búsqueda vectorial aproximada sobre grafos HNSW.",
    "Explicar por qué la suma lineal de puntajes crudos BM25 y distancias vectoriales es inestable y cómo la resuelve Reciprocal Rank Fusion (RRF) con k = 60.",
    "Implementar un pipeline de recuperación híbrida RRF en DuckDB SQL utilizando funciones de ventana ROW_NUMBER(), FULL OUTER JOIN y COALESCE."
  ],
  "sections": [
    {
      "id": "recuperacion-lexica-bm25-vs-hnsw",
      "heading": "Índices invertidos BM25 frente a grafos vectoriales HNSW",
      "body": "Para que un agente elija la herramienta MCP correcta sin saturar el prompt, requiere **Generación Aumentada por Recuperación (RAG)**. En ingeniería de datos, las preguntas mezclan conceptos de negocio con identificadores técnicos exactos. Eso obliga a combinar dos familias de índices.\n\nEl primer pilar es **Okapi BM25** sobre un índice invertido (extensión `fts` en DuckDB). BM25 puntúa cada documento ponderando la frecuencia inversa de documento (**IDF**). También aplica saturación de frecuencia del término ($k_1$) y normalización por longitud del texto ($b$). Es muy preciso cuando el usuario escribe un código como `MB-CAF-156` o la columna `refund_amount_usd`. Sin embargo, falla si la consulta emplea sinónimos ausentes en el texto.\n\nEl segundo pilar es la búsqueda densa mediante vectores e índices **HNSW** (extensión `vss` en DuckDB). Formulado por Malkov y Yashunin, HNSW construye un grafo multicapa. Sus niveles superiores tienen aristas largas para saltar regiones del espacio vectorial. Luego, la capa base localiza los vecinos más cercanos aproximados (**ANN**) en tiempo logarítmico.",
      "example": {
        "language": "sql",
        "code": "SELECT\n  product_id,\n  sku,\n  product_name,\n  subcategory,\n  list_price_usd,\n  ROUND((list_price_usd - unit_cost_usd) / list_price_usd, 4) AS gross_margin_pct\nFROM products\nWHERE category = 'Café en grano'\n  AND sku <> 'SKU-TEST-NEG'\nORDER BY list_price_usd DESC, product_id ASC\nLIMIT 5;",
        "expectedOutput": [
          {
            "product_id": 156,
            "sku": "MB-CAF-156",
            "product_name": "Café en grano Oaxaca Serie 156",
            "subcategory": "Descafeinado de altura",
            "list_price_usd": 41.35,
            "gross_margin_pct": 0.5954
          },
          {
            "product_id": 81,
            "sku": "MB-CAF-081",
            "product_name": "Café en grano Chiapas Serie 81",
            "subcategory": "Descafeinado de altura",
            "list_price_usd": 40.75,
            "gross_margin_pct": 0.5946
          },
          {
            "product_id": 76,
            "sku": "MB-CAF-076",
            "product_name": "Café en grano Oaxaca Serie 76",
            "subcategory": "Origen único",
            "list_price_usd": 40.59,
            "gross_margin_pct": 0.5297
          },
          {
            "product_id": 1,
            "sku": "MB-CAF-001",
            "product_name": "Café en grano Chiapas Serie 1",
            "subcategory": "Origen único",
            "list_price_usd": 39.76,
            "gross_margin_pct": 0.5755
          },
          {
            "product_id": 141,
            "sku": "MB-CAF-141",
            "product_name": "Café en grano Chiapas Serie 141",
            "subcategory": "Descafeinado de altura",
            "list_price_usd": 39.7,
            "gross_margin_pct": 0.5773
          }
        ]
      }
    },
    {
      "id": "frecuencia-rango-reciproco-rrf",
      "heading": "Fusión invariante a escala con Reciprocal Rank Fusion (RRF)",
      "body": "Cuando ejecutamos en paralelo una búsqueda BM25 y una búsqueda HNSW, obtenemos dos listas con escalas incompatibles. El puntaje BM25 es un número positivo no acotado que depende del tamaño del corpus. Por su parte, la distancia coseno vive acotada entre 0 y 2. Sumar directamente ambos puntajes requiere recalibración constante.\n\nEn su artículo de SIGIR, Cormack, Clarke y Büttcher demostraron la eficacia de **Reciprocal Rank Fusion (RRF)**. RRF ignora el puntaje crudo y usa solo la posición ordinal $r_m(d) \\in \\{1, 2, \\dots\\}$ del documento $d$ en cada motor $m$. La fórmula asigna a cada candidato el valor:\n\n$$\\text{RRF}(d) = \\sum_{m \\in \\{\\text{BM25}, \\text{HNSW}\\}} \\frac{1}{k + r_m(d)}$$\n\nLa constante de suavizado $k = 60$ amortigua el peso de un primer puesto aislado. Así, un documento que aparece en buenas posiciones en **ambos** motores obtiene mayor puntaje final. Supera incluso a un candidato que ocupó el puesto 1 en un solo motor pero fue omitido por el otro.",
      "example": {
        "language": "sql",
        "code": "SELECT\n  candidate_type,\n  r_bm25,\n  r_hnsw,\n  ROUND(\n    COALESCE(1.0 / (60 + r_bm25), 0.0) +\n    COALESCE(1.0 / (60 + r_hnsw), 0.0),\n    6\n  ) AS rrf_score\nFROM (\n  SELECT 'Consenso en ambos (4 y 2)' AS candidate_type, 4 AS r_bm25, 2 AS r_hnsw\n  UNION ALL\n  SELECT 'Solo #1 en BM25' AS candidate_type, 1 AS r_bm25, NULL AS r_hnsw\n  UNION ALL\n  SELECT 'Solo #1 en HNSW' AS candidate_type, NULL AS r_bm25, 1 AS r_hnsw\n)\nORDER BY rrf_score DESC, 1 ASC;",
        "expectedOutput": [
          {
            "candidate_type": "Consenso en ambos (4 y 2)",
            "r_bm25": 4,
            "r_hnsw": 2,
            "rrf_score": 0.031754
          },
          {
            "candidate_type": "Solo #1 en BM25",
            "r_bm25": 1,
            "r_hnsw": null,
            "rrf_score": 0.016393
          },
          {
            "candidate_type": "Solo #1 en HNSW",
            "r_bm25": null,
            "r_hnsw": 1,
            "rrf_score": 0.016393
          }
        ]
      }
    }
  ],
  "workedExample": {
    "title": "Recuperación híbrida RRF (k = 60) sobre la categoría Cafeteras",
    "description": "Construye en DuckDB SQL un motor de recuperación híbrida RRF ($k = 60$) para asistir al servidor MCP al buscar productos de la categoría `'Cafeteras'` en Mercado Brisa (excluyendo `SKU-TEST-NEG`). Combinaremos un ranking léxico/comercial (`r_bm25`) y un ranking de similitud vectorial al perfil objetivo de margen bruto del 50 % (`r_hnsw`).",
    "audit": "En el resultado final, los cuatro primeros productos (`MB-CAF-158`, `MB-CAF-008`, `MB-CAF-173`, `MB-CAF-113`) aparecen en ambos rankings y superan al puesto #1 aislado (`MB-CAF-073`).",
    "steps": [
      {
        "label": "Paso 1: Generar el ranking léxico (r_bm25) con ROW_NUMBER()",
        "explanation": "Generamos la primera CTE `lexical_rank` con los 10 mejores candidatos de `category = 'Cafeteras'` sin `SKU-TEST-NEG`, asignando `r_bm25` con `ROW_NUMBER()` según coincidencia de términos (`espresso` / `pro`) y precio de lista.",
        "code": "SELECT\n  p.product_id,\n  p.sku,\n  ROW_NUMBER() OVER (\n    ORDER BY\n      (CASE WHEN LOWER(p.subcategory) LIKE '%espresso%' OR LOWER(p.product_name) LIKE '%pro%' THEN 2 ELSE 1 END) DESC,\n      p.list_price_usd DESC,\n      p.product_id ASC\n  ) AS r_bm25\nFROM products p\nWHERE p.category = 'Cafeteras'\n  AND p.sku <> 'SKU-TEST-NEG'\nLIMIT 5;",
        "expectedOutput": [
          {
            "product_id": 98,
            "sku": "MB-CAF-098",
            "r_bm25": 1
          },
          {
            "product_id": 128,
            "sku": "MB-CAF-128",
            "r_bm25": 2
          },
          {
            "product_id": 83,
            "sku": "MB-CAF-083",
            "r_bm25": 3
          },
          {
            "product_id": 68,
            "sku": "MB-CAF-068",
            "r_bm25": 4
          },
          {
            "product_id": 8,
            "sku": "MB-CAF-008",
            "r_bm25": 5
          }
        ]
      },
      {
        "label": "Paso 2: Generar el ranking de similitud de perfil (r_hnsw)",
        "explanation": "Generamos la segunda CTE `vector_rank` con los 10 candidatos más cercanos en distancia absoluta al margen bruto objetivo de `0.50`, asignando la posición ordinal `r_hnsw` mediante `ROW_NUMBER()`.",
        "code": "SELECT\n  p.product_id,\n  p.sku,\n  ROW_NUMBER() OVER (\n    ORDER BY\n      ABS((p.list_price_usd - p.unit_cost_usd) / NULLIF(p.list_price_usd, 0) - 0.50) ASC,\n      p.product_id ASC\n  ) AS r_hnsw\nFROM products p\nWHERE p.category = 'Cafeteras'\n  AND p.sku <> 'SKU-TEST-NEG'\nLIMIT 5;",
        "expectedOutput": [
          {
            "product_id": 73,
            "sku": "MB-CAF-073",
            "r_hnsw": 1
          },
          {
            "product_id": 13,
            "sku": "MB-CAF-013",
            "r_hnsw": 2
          },
          {
            "product_id": 158,
            "sku": "MB-CAF-158",
            "r_hnsw": 3
          },
          {
            "product_id": 173,
            "sku": "MB-CAF-173",
            "r_hnsw": 4
          },
          {
            "product_id": 148,
            "sku": "MB-CAF-148",
            "r_hnsw": 5
          }
        ]
      },
      {
        "label": "Paso 3: Fusionar ambos rankings con FULL OUTER JOIN y k = 60",
        "explanation": "Fusionamos ambas listas de 10 candidatos mediante `FULL OUTER JOIN` por `product_id`, aplicamos la fórmula RRF con $k = 60$ y `COALESCE(..., 0.0)`, y ordenamos por `rrf_score DESC, product_id ASC` para obtener el top 5 final.",
        "code": "WITH lexical_rank AS (\n  SELECT\n    p.product_id,\n    p.sku,\n    ROW_NUMBER() OVER (\n      ORDER BY\n        (CASE WHEN LOWER(p.subcategory) LIKE '%espresso%' OR LOWER(p.product_name) LIKE '%pro%' THEN 2 ELSE 1 END) DESC,\n        p.list_price_usd DESC,\n        p.product_id ASC\n    ) AS r_bm25\n  FROM products p\n  WHERE p.category = 'Cafeteras'\n    AND p.sku <> 'SKU-TEST-NEG'\n  LIMIT 10\n),\nvector_rank AS (\n  SELECT\n    p.product_id,\n    p.sku,\n    ROW_NUMBER() OVER (\n      ORDER BY\n        ABS((p.list_price_usd - p.unit_cost_usd) / NULLIF(p.list_price_usd, 0) - 0.50) ASC,\n        p.product_id ASC\n    ) AS r_hnsw\n  FROM products p\n  WHERE p.category = 'Cafeteras'\n    AND p.sku <> 'SKU-TEST-NEG'\n  LIMIT 10\n)\nSELECT\n  COALESCE(l.product_id, v.product_id) AS product_id,\n  COALESCE(l.sku, v.sku) AS sku,\n  l.r_bm25,\n  v.r_hnsw,\n  ROUND(\n    COALESCE(1.0 / (60 + l.r_bm25), 0.0) +\n    COALESCE(1.0 / (60 + v.r_hnsw), 0.0),\n    6\n  ) AS rrf_score\nFROM lexical_rank l\nFULL OUTER JOIN vector_rank v ON l.product_id = v.product_id\nORDER BY rrf_score DESC, product_id ASC\nLIMIT 5;",
        "expectedOutput": [
          {
            "product_id": 158,
            "sku": "MB-CAF-158",
            "r_bm25": 9,
            "r_hnsw": 3,
            "rrf_score": 0.030366
          },
          {
            "product_id": 8,
            "sku": "MB-CAF-008",
            "r_bm25": 5,
            "r_hnsw": 8,
            "rrf_score": 0.03009
          },
          {
            "product_id": 173,
            "sku": "MB-CAF-173",
            "r_bm25": 10,
            "r_hnsw": 4,
            "rrf_score": 0.029911
          },
          {
            "product_id": 113,
            "sku": "MB-CAF-113",
            "r_bm25": 7,
            "r_hnsw": 10,
            "rrf_score": 0.029211
          },
          {
            "product_id": 73,
            "sku": "MB-CAF-073",
            "r_bm25": null,
            "r_hnsw": 1,
            "rrf_score": 0.016393
          }
        ]
      }
    ]
  },
  "checks": [
    {
      "id": "chk-x4-03-bm25-vs-hnsw",
      "type": "mcq",
      "prompt": "Un analista busca en el catálogo de un servidor MCP el identificador exacto `MB-MOL-137` y la columna técnica `idempotency_key`. ¿Qué motor de recuperación ofrece mayor precisión para este patrón y por qué?",
      "options": [
        {
          "id": "a",
          "text": "El índice vectorial HNSW solo, porque la distancia coseno distingue letras individuales sin tokenización.",
          "correct": false,
          "feedback": "Incorrecto. Los embeddings densos tienden a colapsar códigos alfanuméricos similares en regiones muy cercanas del espacio vectorial."
        },
        {
          "id": "b",
          "text": "El índice invertido con Okapi BM25, porque evalúa coincidencias exactas de tokens raros ponderadas por su alta frecuencia inversa de documento (IDF).",
          "correct": true,
          "feedback": "Correcto. BM25 localiza tokens exactos en el índice invertido y premia identificadores con alto IDF."
        },
        {
          "id": "c",
          "text": "Un muestreo aleatorio con TABLESAMPLE, porque evita leer el catálogo.",
          "correct": false,
          "feedback": "Incorrecto. Un muestreo aleatorio no realiza ninguna recuperación por relevancia sobre la consulta."
        },
        {
          "id": "d",
          "text": "Ninguno, porque los códigos con guiones no pueden indexarse en bases de datos.",
          "correct": false,
          "feedback": "Incorrecto. Los tokenizadores e índices invertidos indexan cadenas alfanuméricas sin inconvenientes."
        }
      ],
      "explanation": "Okapi BM25 opera sobre un índice invertido de términos exactos y asigna un peso IDF muy alto a códigos alfanuméricos únicos como MB-MOL-137 o nombres de columnas."
    },
    {
      "id": "chk-x4-03-rrf-math",
      "type": "predict-output",
      "prompt": "Usando la fórmula de Reciprocal Rank Fusion con $k = 60$, ¿cuál es el puntaje RRF redondeado a 6 decimales de un documento que ocupa la posición `rank_bm25 = 4` y la posición `rank_hnsw = 2`?",
      "options": [
        {
          "id": "a",
          "text": "0.031754, resultado de sumar 1/(60+4) = 1/64 y 1/(60+2) = 1/62.",
          "correct": true,
          "feedback": "Correcto. 1/64 (0.015625) + 1/62 (0.01612903) es igual a 0.031754."
        },
        {
          "id": "b",
          "text": "0.750000, resultado de sumar 1/4 y 1/2 sin constante k.",
          "correct": false,
          "feedback": "Incorrecto. Omitir la constante k = 60 daría un peso desproporcionado al rango #1."
        },
        {
          "id": "c",
          "text": "0.016393, porque RRF solo toma el mejor de los dos rangos (1/61).",
          "correct": false,
          "feedback": "Incorrecto. RRF suma las contribuciones de todos los motores donde aparece el documento."
        },
        {
          "id": "d",
          "text": "6.000000, resultado de sumar las posiciones 4 + 2.",
          "correct": false,
          "feedback": "Incorrecto. Sumar rangos crudos penalizaría a los primeros lugares en vez de premiarlos."
        }
      ],
      "explanation": "Con k = 60, el aporte de BM25 es 1/64 = 0.015625 y el aporte de HNSW es 1/62 = 0.01612903; su suma redondeada a 6 decimales es 0.031754."
    },
    {
      "id": "chk-x4-03-spot-bug-join",
      "type": "mcq",
      "prompt": "Al implementar RRF en SQL, un desarrollador escribe `FROM lexical_candidates l INNER JOIN vector_candidates v ON l.product_id = v.product_id`. ¿Qué defecto introduce este `INNER JOIN`?",
      "options": [
        {
          "id": "a",
          "text": "Descarta todos los documentos que aparecieron en el top-K de un solo buscador, como un SKU exacto capturado únicamente por BM25.",
          "correct": true,
          "feedback": "Correcto. Si un SKU exacto solo fue recuperado por BM25, INNER JOIN lo elimina del resultado final."
        },
        {
          "id": "b",
          "text": "Duplica el valor de la constante k de 60 a 120.",
          "correct": false,
          "feedback": "Incorrecto. El tipo de JOIN no modifica las constantes aritméticas de las expresiones SELECT."
        },
        {
          "id": "c",
          "text": "Impide usar la función de ventana ROW_NUMBER() en las CTEs previas.",
          "correct": false,
          "feedback": "Incorrecto. Las funciones de ventana en las CTEs se evalúan antes del JOIN externo."
        },
        {
          "id": "d",
          "text": "Convierte los identificadores enteros product_id en cadenas de texto.",
          "correct": false,
          "feedback": "Incorrecto. INNER JOIN conserva los tipos de datos de las columnas originales."
        }
      ],
      "explanation": "RRF requiere un FULL OUTER JOIN acompañado de COALESCE(1.0 / (60 + rank), 0.0) para conservar tanto los documentos de consenso como los especialistas de un solo índice."
    },
    {
      "id": "chk-x4-03-fill-blank-k",
      "type": "fill-code",
      "prompt": "Completa el valor estándar de la constante de amortiguamiento k establecida por Cormack et al. en el denominador de Reciprocal Rank Fusion:",
      "template": "COALESCE(1.0 / ({{b1}} + l.rank_bm25), 0.0)",
      "blanks": [
        {
          "id": "b1",
          "accepted": [
            "60",
            "60.0"
          ]
        }
      ],
      "explanation": "Cormack, Clarke y Büttcher establecieron k = 60 como constante estable para amortiguar valores atípicos de rango #1 y premiar la consistencia entre múltiples recuperadores."
    }
  ],
  "practice": {
    "type": "sql",
    "title": "Fusión híbrida Reciprocal Rank Fusion (RRF) sobre catálogo de Molinos",
    "language": "sql",
    "prompt": "Completa la consulta de recuperación híbrida RRF ($k = 60$) sobre la categoría `'Molinos'` en la tabla `products` de Mercado Brisa (excluyendo `sku = 'SKU-TEST-NEG'`). Las dos CTEs `lexical_candidates` (top 8 por `list_price_usd DESC, product_id ASC`) y `vector_candidates` (top 8 por razón de margen `(list_price_usd - unit_cost_usd) / list_price_usd DESC, product_id ASC`) ya están definidas. Corrige el bloque final para unirlas con `FULL OUTER JOIN` por `product_id`, usar `COALESCE` en `product_id`, `sku` y en ambos términos de la suma RRF (`1.0 / (60 + rank)`), redondear `rrf_score` a 6 decimales y devolver los primeros 5 resultados ordenados por `rrf_score DESC, product_id ASC`.",
    "starterCode": "WITH lexical_candidates AS (\n  SELECT\n    product_id,\n    sku,\n    ROW_NUMBER() OVER (ORDER BY list_price_usd DESC, product_id ASC) AS rank_bm25\n  FROM products\n  WHERE category = 'Molinos'\n    AND sku <> 'SKU-TEST-NEG'\n  LIMIT 8\n),\nvector_candidates AS (\n  SELECT\n    product_id,\n    sku,\n    ROW_NUMBER() OVER (\n      ORDER BY (list_price_usd - unit_cost_usd) / list_price_usd DESC, product_id ASC\n    ) AS rank_hnsw\n  FROM products\n  WHERE category = 'Molinos'\n    AND sku <> 'SKU-TEST-NEG'\n  LIMIT 8\n)\n-- Corrige el INNER JOIN por FULL OUTER JOIN y usa COALESCE en las columnas y en la fórmula RRF:\nSELECT\n  l.product_id,\n  l.sku,\n  l.rank_bm25,\n  v.rank_hnsw,\n  ROUND((1.0 / (60 + l.rank_bm25)) + (1.0 / (60 + v.rank_hnsw)), 6) AS rrf_score\nFROM lexical_candidates l\nINNER JOIN vector_candidates v ON l.product_id = v.product_id\nORDER BY rrf_score DESC, product_id ASC\nLIMIT 5;",
    "solution": "WITH lexical_candidates AS (\n  SELECT\n    product_id,\n    sku,\n    ROW_NUMBER() OVER (ORDER BY list_price_usd DESC, product_id ASC) AS rank_bm25\n  FROM products\n  WHERE category = 'Molinos'\n    AND sku <> 'SKU-TEST-NEG'\n  LIMIT 8\n),\nvector_candidates AS (\n  SELECT\n    product_id,\n    sku,\n    ROW_NUMBER() OVER (\n      ORDER BY (list_price_usd - unit_cost_usd) / list_price_usd DESC, product_id ASC\n    ) AS rank_hnsw\n  FROM products\n  WHERE category = 'Molinos'\n    AND sku <> 'SKU-TEST-NEG'\n  LIMIT 8\n)\nSELECT\n  COALESCE(l.product_id, v.product_id) AS product_id,\n  COALESCE(l.sku, v.sku) AS sku,\n  l.rank_bm25,\n  v.rank_hnsw,\n  ROUND(\n    COALESCE(1.0 / (60 + l.rank_bm25), 0.0) +\n    COALESCE(1.0 / (60 + v.rank_hnsw), 0.0),\n    6\n  ) AS rrf_score\nFROM lexical_candidates l\nFULL OUTER JOIN vector_candidates v ON l.product_id = v.product_id\nORDER BY rrf_score DESC, product_id ASC\nLIMIT 5;",
    "solutionExplanation": "El uso de FULL OUTER JOIN junto con COALESCE(l.product_id, v.product_id) y COALESCE(1.0 / (60 + rank), 0.0) permite fusionar ambas listas sin perder los productos exclusivos de un solo motor, situando en el top 2 a los molinos de consenso (MB-MOL-137 y MB-MOL-167).",
    "expectedOutputTable": [
      {
        "product_id": 137,
        "sku": "MB-MOL-137",
        "rank_bm25": 4,
        "rank_hnsw": 2,
        "rrf_score": 0.031754
      },
      {
        "product_id": 167,
        "sku": "MB-MOL-167",
        "rank_bm25": 5,
        "rank_hnsw": 6,
        "rrf_score": 0.030536
      },
      {
        "product_id": 142,
        "sku": "MB-MOL-142",
        "rank_bm25": null,
        "rank_hnsw": 1,
        "rrf_score": 0.016393
      },
      {
        "product_id": 162,
        "sku": "MB-MOL-162",
        "rank_bm25": 1,
        "rank_hnsw": null,
        "rrf_score": 0.016393
      },
      {
        "product_id": 2,
        "sku": "MB-MOL-002",
        "rank_bm25": 2,
        "rank_hnsw": null,
        "rrf_score": 0.016129
      }
    ],
    "orderMatters": true,
    "hints": [
      "Cambia INNER JOIN por FULL OUTER JOIN para conservar los molinos que solo aparecen en una de las dos listas de 8 candidatos.",
      "Usa COALESCE(l.product_id, v.product_id) AS product_id y COALESCE(l.sku, v.sku) AS sku para que las filas sin par en la tabla izquierda no devuelvan NULL en el identificador.",
      "Envuelve cada término de RRF con COALESCE(1.0 / (60 + l.rank_bm25), 0.0) y COALESCE(1.0 / (60 + v.rank_hnsw), 0.0) antes de sumarlos y redondear a 6 decimales."
    ]
  },
  "roleNotes": {
    "de": "Como Ingeniero de Datos, indexas los metadatos del catálogo y las tablas de dimensiones directamente en el motor analítico usando extensiones como fts (BM25) y vss (HNSW) en DuckDB, evitando sincronizar bases vectoriales externas innecesarias.",
    "da": "Como Analista de Datos, auditas la calidad de recuperación (Recall@K y MRR) comprobando que tanto los nombres comerciales en lenguaje natural como los códigos SKU exactos aparezcan en el top-5 entregado al agente.",
    "bi": "Como especialista en BI, enriqueces las descripciones de métricas y sinónimos de negocio en el glosario para que el índice híbrido conecte la jerga ejecutiva con la métrica gobernada correcta."
  },
  "summary": [
    "La búsqueda léxica Okapi BM25 sobresale en códigos exactos e identificadores, mientras que los grafos HNSW capturan similitud semántica.",
    "Sumar puntajes crudos BM25 y distancias vectoriales falla porque sus escalas y distribuciones estadísticas son incompatibles.",
    "Reciprocal Rank Fusion (RRF) combina rankings mediante la suma de 1 / (60 + posición), premiando el consenso entre buscadores.",
    "En SQL, RRF se implementa con ROW_NUMBER(), FULL OUTER JOIN y COALESCE para preservar candidatos presentes en un solo índice."
  ],
  "flashcards": [
    {
      "id": "fc-x4-03-1",
      "front": "¿Qué ventaja aporta un grafo HNSW en la búsqueda vectorial sobre catálogos grandes?",
      "back": "Permite encontrar los vecinos más cercanos aproximados (ANN) en tiempo logarítmico navegando desde capas superiores de aristas largas hasta la capa base densa."
    },
    {
      "id": "fc-x4-03-2",
      "front": "¿Por qué no deben sumarse directamente el puntaje BM25 y la similitud coseno en un RAG híbrido?",
      "back": "Porque BM25 no está acotado superiormente y depende de la distribución del corpus, mientras que la similitud coseno vive en el intervalo [-1, 1]."
    },
    {
      "id": "fc-x4-03-3",
      "front": "¿Cuál es la ecuación de Reciprocal Rank Fusion (RRF) para un documento d?",
      "back": "La suma sobre cada motor m de la fracción 1 / (k + r_m(d)), donde r_m(d) es la posición ordinal del documento y k suele fijarse en 60."
    },
    {
      "id": "fc-x4-03-4",
      "front": "¿Qué ocurre en una consulta SQL de RRF si omites COALESCE(..., 0.0) al sumar las fracciones tras un FULL OUTER JOIN?",
      "back": "Cualquier documento presente en un solo buscador tendrá NULL en el rango del otro motor, y la suma aritmética devolverá NULL como rrf_score."
    }
  ],
  "glossaryTerms": [
    "okapi-bm25",
    "hnsw-vector-index",
    "reciprocal-rank-fusion",
    "c28-mcp-semantic-rag-evals"
  ],
  "sources": [
    {
      "title": "Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods",
      "url": "https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf",
      "publisher": "ACM SIGIR (Cormack, Clarke & Büttcher)",
      "accessed": "2026-10-29",
      "supports": "Formulación matemática de RRF con constante k = 60 y superioridad empírica frente a métodos de fusión individuales."
    },
    {
      "title": "Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs",
      "url": "https://arxiv.org/abs/1603.09320",
      "publisher": "IEEE TPAMI / arXiv (Malkov & Yashunin)",
      "accessed": "2026-10-29",
      "supports": "Estructura multicapa de grafos HNSW para búsqueda vectorial aproximada de baja latencia."
    },
    {
      "title": "DuckDB Full-Text Search Extension (BM25)",
      "url": "https://duckdb.org/docs/stable/extensions/full_text_search",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Creación de índices invertidos y cálculo de relevancia léxica mediante match_bm25 en DuckDB."
    },
    {
      "title": "DuckDB Vector Similarity Search Extension (vss)",
      "url": "https://duckdb.org/docs/stable/extensions/vss",
      "publisher": "DuckDB Foundation",
      "accessed": "2026-10-29",
      "supports": "Índices HNSW sobre arreglos de dimensión fija y funciones de distancia vectorial en SQL."
    }
  ],
  "aiNotes": "En esta lección, ayuda al estudiante a comprender por qué MB-MOL-137 (rangos 4 y 2, rrf_score = 0.031754) y MB-MOL-167 (rangos 5 y 6, rrf_score = 0.030536) superan a MB-MOL-142 y MB-MOL-162 (rango 1 en un solo índice, rrf_score = 0.016393). Revisa que use FULL OUTER JOIN y tres llamadas a COALESCE en la práctica.",
  "needsReview": false
};

export default lesson;
