// Mapa heredado de tokens de etapa/rol a variables CSS (--role-de, --role-da, --role-bi, --brand).
// Conservado para compatibilidad con vistas existentes sin acoplar colores hexadecimales.

export const STAGE_THEMES = [
  {
    number: 1,
    id: 'stage-1',
    shortName: 'SQL',
    name: 'Fundamentos y SQL analítico',
    color: 'var(--brand)',
    iconName: 'Database',
  },
  {
    number: 2,
    id: 'stage-2',
    shortName: 'Modelado',
    name: 'Modelado dimensional y diseño de métricas',
    color: 'var(--role-da)',
    iconName: 'Layers',
  },
  {
    number: 3,
    id: 'stage-3',
    shortName: 'Columnar',
    name: 'Motores columnares y formatos físicos',
    color: 'var(--role-de)',
    iconName: 'Cpu',
  },
  {
    number: 4,
    id: 'stage-4',
    shortName: 'Lakehouse',
    name: 'Lakehouse abierto, transformación y capa semántica',
    color: 'var(--role-bi)',
    iconName: 'Workflow',
  },
  {
    number: 5,
    id: 'stage-5',
    shortName: 'Estadística y BI',
    name: 'Estadística aplicada, experimentación y visualización',
    color: 'var(--brand)',
    iconName: 'BarChart3',
  },
  {
    number: 6,
    id: 'stage-6',
    shortName: 'Streaming e IA',
    name: 'Flujos en tiempo real y agentes MCP',
    color: 'var(--role-de)',
    iconName: 'Sparkles',
  },
]

export const ROLE_THEMES = {
  DE: {
    key: 'DE',
    id: 'DE',
    short: 'DE',
    label: 'Ingeniería de datos',
    iconName: 'Database',
    color: 'var(--role-de)',
  },
  DA: {
    key: 'DA',
    id: 'DA',
    short: 'DA',
    label: 'Análisis de datos',
    iconName: 'Sigma',
    color: 'var(--role-da)',
  },
  BI: {
    key: 'BI',
    id: 'BI',
    short: 'BI',
    label: 'Business Intelligence',
    iconName: 'LayoutDashboard',
    color: 'var(--role-bi)',
  },
}

export const STAGE_VARS = {
  0: 'var(--brand)',
  1: 'var(--role-da)',
  2: 'var(--role-de)',
  3: 'var(--role-bi)',
  4: 'var(--brand)',
  5: 'var(--role-de)',
  6: 'var(--role-bi)',
  de: 'var(--role-de)',
  da: 'var(--role-da)',
  bi: 'var(--role-bi)',
}

export function getStageNumber(stageOrLesson) {
  if (stageOrLesson === null || stageOrLesson === undefined) return 1

  if (typeof stageOrLesson === 'number' && Number.isFinite(stageOrLesson)) {
    return Math.min(6, Math.max(1, Math.round(stageOrLesson)))
  }

  if (typeof stageOrLesson === 'string') {
    const trimmed = stageOrLesson.trim().toLowerCase()
    const directNum = Number(trimmed)
    if (Number.isFinite(directNum) && directNum >= 1 && directNum <= 6) {
      return Math.round(directNum)
    }
    const stageMatch = trimmed.match(/stage-(\d+)/)
    if (stageMatch) {
      const n = Number(stageMatch[1])
      return Math.min(6, Math.max(1, n))
    }
    const lessonMatch = trimmed.match(/^l(\d+)/)
    if (lessonMatch) {
      const lessonNum = Number(lessonMatch[1])
      return Math.min(6, Math.max(1, Math.ceil(lessonNum / 3)))
    }
    return 1
  }

  if (typeof stageOrLesson === 'object') {
    if (typeof stageOrLesson.stage === 'number') {
      return getStageNumber(stageOrLesson.stage)
    }
    if (typeof stageOrLesson.stageNumber === 'number') {
      return getStageNumber(stageOrLesson.stageNumber)
    }
    if (
      typeof stageOrLesson.number === 'number' &&
      stageOrLesson.number >= 1 &&
      stageOrLesson.number <= 6
    ) {
      return stageOrLesson.number
    }
    if (stageOrLesson.stageId) {
      return getStageNumber(stageOrLesson.stageId)
    }
    if (stageOrLesson.id) {
      return getStageNumber(stageOrLesson.id)
    }
    if (typeof stageOrLesson.order === 'number') {
      return Math.min(6, Math.max(1, Math.ceil(stageOrLesson.order / 3)))
    }
  }

  return 1
}

export function getStageTheme(stageOrLesson) {
  const num = getStageNumber(stageOrLesson)
  return STAGE_THEMES[num - 1] || STAGE_THEMES[0]
}

export function getRoleMeta(roleKey) {
  if (!roleKey) return ROLE_THEMES.DE
  const upper = String(roleKey).trim().toUpperCase()
  if (ROLE_THEMES[upper]) return ROLE_THEMES[upper]
  if (upper.includes('DA') || upper.includes('ANÁLISIS') || upper.includes('ANALISIS')) {
    return ROLE_THEMES.DA
  }
  if (upper.includes('BI') || upper.includes('BUSINESS')) {
    return ROLE_THEMES.BI
  }
  return ROLE_THEMES.DE
}

export function resolveStageToken(stage) {
  if (stage === undefined || stage === null || stage === '') return null
  if (typeof stage === 'number' && STAGE_VARS[stage]) {
    return STAGE_VARS[stage]
  }
  const key = String(stage).trim().toLowerCase()
  if (STAGE_VARS[key]) return STAGE_VARS[key]
  const match = key.match(/(\d+)/)
  if (match && STAGE_VARS[Number(match[1])]) {
    return STAGE_VARS[Number(match[1])]
  }
  if (key.startsWith('var(') || key.startsWith('#') || key.startsWith('rgb')) {
    return stage
  }
  return 'var(--brand)'
}

export function stageStyle(stage, extra = {}) {
  const token = resolveStageToken(stage)
  if (!token) return extra
  return { '--stage-color': token, ...extra }
}
