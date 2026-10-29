export const STAGE_THEMES = [
  {
    number: 1,
    id: 'stage-1',
    shortName: 'SQL',
    name: 'Fundamentos y SQL analítico',
    color: '#FF6B4A',
    iconName: 'Database',
  },
  {
    number: 2,
    id: 'stage-2',
    shortName: 'Modelado',
    name: 'Modelado dimensional y diseño de métricas',
    color: '#F2A516',
    iconName: 'Layers',
  },
  {
    number: 3,
    id: 'stage-3',
    shortName: 'Columnar',
    name: 'Motores columnares y formatos físicos',
    color: '#1DB371',
    iconName: 'Cpu',
  },
  {
    number: 4,
    id: 'stage-4',
    shortName: 'Lakehouse',
    name: 'Lakehouse abierto, transformación y capa semántica',
    color: '#16A8B8',
    iconName: 'Workflow',
  },
  {
    number: 5,
    id: 'stage-5',
    shortName: 'Estadística y BI',
    name: 'Estadística aplicada, experimentación y visualización',
    color: '#3C7BFF',
    iconName: 'BarChart3',
  },
  {
    number: 6,
    id: 'stage-6',
    shortName: 'Streaming e IA',
    name: 'Flujos en tiempo real y agentes MCP',
    color: '#8A5CFF',
    iconName: 'Sparkles',
  },
];

export const ROLE_THEMES = {
  DE: {
    key: 'DE',
    id: 'DE',
    short: 'DE',
    label: 'Ingeniería de datos',
    iconName: 'Database',
    color: '#2F6BFF',
  },
  DA: {
    key: 'DA',
    id: 'DA',
    short: 'DA',
    label: 'Análisis de datos',
    iconName: 'Sigma',
    color: '#0FA968',
  },
  BI: {
    key: 'BI',
    id: 'BI',
    short: 'BI',
    label: 'Business Intelligence',
    iconName: 'LayoutDashboard',
    color: '#F08A24',
  },
};

export function getStageNumber(stageOrLesson) {
  if (stageOrLesson === null || stageOrLesson === undefined) return 1;

  if (typeof stageOrLesson === 'number' && Number.isFinite(stageOrLesson)) {
    return Math.min(6, Math.max(1, Math.round(stageOrLesson)));
  }

  if (typeof stageOrLesson === 'string') {
    const trimmed = stageOrLesson.trim().toLowerCase();
    const directNum = Number(trimmed);
    if (Number.isFinite(directNum) && directNum >= 1 && directNum <= 6) {
      return Math.round(directNum);
    }
    const stageMatch = trimmed.match(/stage-(\d+)/);
    if (stageMatch) {
      const n = Number(stageMatch[1]);
      return Math.min(6, Math.max(1, n));
    }
    const lessonMatch = trimmed.match(/^l(\d+)/);
    if (lessonMatch) {
      const lessonNum = Number(lessonMatch[1]);
      return Math.min(6, Math.max(1, Math.ceil(lessonNum / 3)));
    }
    return 1;
  }

  if (typeof stageOrLesson === 'object') {
    if (typeof stageOrLesson.stage === 'number') {
      return getStageNumber(stageOrLesson.stage);
    }
    if (typeof stageOrLesson.stageNumber === 'number') {
      return getStageNumber(stageOrLesson.stageNumber);
    }
    if (typeof stageOrLesson.number === 'number' && stageOrLesson.number >= 1 && stageOrLesson.number <= 6) {
      return stageOrLesson.number;
    }
    if (stageOrLesson.stageId) {
      return getStageNumber(stageOrLesson.stageId);
    }
    if (stageOrLesson.id) {
      return getStageNumber(stageOrLesson.id);
    }
    if (typeof stageOrLesson.order === 'number') {
      return Math.min(6, Math.max(1, Math.ceil(stageOrLesson.order / 3)));
    }
  }

  return 1;
}

export function getStageTheme(stageOrLesson) {
  const num = getStageNumber(stageOrLesson);
  return STAGE_THEMES[num - 1] || STAGE_THEMES[0];
}

export function getRoleMeta(roleKey) {
  if (!roleKey) return ROLE_THEMES.DE;
  const upper = String(roleKey).trim().toUpperCase();
  if (ROLE_THEMES[upper]) return ROLE_THEMES[upper];
  if (upper.includes('DA') || upper.includes('ANÁLISIS') || upper.includes('ANALISIS')) {
    return ROLE_THEMES.DA;
  }
  if (upper.includes('BI') || upper.includes('BUSINESS')) {
    return ROLE_THEMES.BI;
  }
  return ROLE_THEMES.DE;
}
