// Niveles de la ruta curricular de Grano (0 Cimientos a 4 Experto).
// Refinado y validado (ver docs/curriculo/fuentes.md y docs/curriculo/cambios-catalogo.md).

export const LEVELS = [
  {
    id: 0,
    level: 0,
    name: 'Cimientos',
    summary: 'Para empezar desde cero, sin experiencia técnica previa.',
    outcome:
      'Al terminar sabrás distinguir tipos de datos y archivos, resumir tablas en hojas de cálculo, calcular medidas descriptivas sin engaños, interpretar indicadores de negocio y manejarte en la terminal, Git y Python inicial.',
  },
  {
    id: 1,
    level: 1,
    name: 'Fundamentos',
    summary: 'SQL relacional, control del grano en JOINs, calidad de datos, Python tabular y gráficos honestos.',
    outcome:
      'Al terminar sabrás escribir consultas SQL sobre múltiples tablas sin duplicar importes, validar la integridad de un esquema relacional, transformar datos con Polars y pandas y presentar resultados en tablas y gráficos claros.',
  },
  {
    id: 2,
    level: 2,
    name: 'Intermedio',
    summary: 'SQL analítico, modelado dimensional de Kimball y el primer bloque técnico de tu área.',
    outcome:
      'Al terminar sabrás resolver series y cruces temporales con funciones de ventana y ASOF JOIN, diseñar esquemas en estrella con historial SCD tipo 2 y ejecutar con solvencia las tareas cotidianas de tu área.',
  },
  {
    id: 3,
    level: 3,
    name: 'Avanzado',
    summary: 'Lakehouse abierto y transformación, experimentación y producto, o diseño y gobierno de BI.',
    outcome:
      'Al terminar sabrás construir y auditar soluciones completas en tu especialidad (tablas Iceberg y contratos en DE, cohortes y pruebas A/B con CUPED en DA, o tableros y capas semánticas con RLS en BI).',
  },
  {
    id: 4,
    level: 4,
    name: 'Experto',
    summary: 'Streaming y arquitectura de plataforma, inferencia causal, BI como código, agentes MCP y portafolio.',
    outcome:
      'Al terminar sabrás diseñar sistemas de datos de extremo a extremo, justificar compensaciones técnicas y de costo, conectar agentes de lenguaje a métricas gobernadas vía MCP y defender tu portafolio en entrevistas técnicas.',
  },
];

export const LEVEL_IDS = LEVELS.map((l) => l.level);
