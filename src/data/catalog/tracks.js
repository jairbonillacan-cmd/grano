// Áreas de la ruta. BORRADOR: la tarea T3 de PLAN_GEMINI_4_ARGON.md lo investiga y corrige.
export const TRACKS = [
  {
    id: 'core',
    name: 'Tronco común',
    short: 'Común',
    summary: 'Lo que toda persona de datos necesita, haga lo que haga después.',
    dayToDay: [
      'Leer una tabla y saber qué representa cada fila.',
      'Escribir consultas SQL que no dupliquen ni pierdan datos.',
      'Explicar un número a alguien que no es técnico.',
    ],
  },
  {
    id: 'de',
    name: 'Ingeniería de Datos',
    short: 'DE',
    summary: 'Construyes y mantienes los sistemas que mueven y guardan los datos.',
    dayToDay: [
      'Diseñar un pipeline que cargue datos nuevos cada hora sin duplicarlos.',
      'Elegir formato, particionado y motor para que una consulta cueste menos.',
      'Investigar por qué una tabla llegó tarde o con datos rotos.',
    ],
  },
  {
    id: 'da',
    name: 'Análisis de Datos',
    short: 'DA',
    summary: 'Respondes preguntas de negocio con datos y con método estadístico.',
    dayToDay: [
      'Medir si un cambio en el producto mejoró la conversión.',
      'Encontrar por qué cayó la retención de los clientes de marzo.',
      'Escribir un memo con la conclusión y su nivel de certeza.',
    ],
  },
  {
    id: 'bi',
    name: 'Business Intelligence',
    short: 'BI',
    summary: 'Das a la empresa métricas confiables y tableros que se usan.',
    dayToDay: [
      'Definir una métrica para que todos los equipos la calculen igual.',
      'Modelar los datos en Power BI y escribir sus medidas en DAX.',
      'Diseñar un tablero ejecutivo que se entienda en 10 segundos.',
    ],
  },
];

export const TRACK_IDS = TRACKS.map((t) => t.id);
