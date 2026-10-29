/**
 * @fileoverview EdTech Adaptive Learning Engine (2026)
 * Pure, deterministic ES module implementing:
 * 1. Bloom's Revised Taxonomy cognitive levels (`BLOOM_LEVELS`)
 * 2. Item Response Theory (1PL/2PL logistic MAP) ability estimation (`estimateAbilityIRT`)
 * 3. Multi-discipline (DE, DA, BI) & Bloom mastery analytics (`calculateDisciplineMastery`)
 * 4. Zone of Proximal Development (ZPD) & prerequisite recommendations (`getAdaptiveRecommendations`)
 *
 * Zero external dependencies. Designed for the 18-lesson Data Engineering (DE),
 * Data Analysis (DA), and Business Intelligence (BI) integrated learning platform.
 */

// ============================================================================
// 1. BLOOM'S TAXONOMY COGNITIVE LEVELS (Ordered Lower-Order -> Higher-Order)
// ============================================================================

const BLOOM_LEVEL_DEFINITIONS = [
  {
    id: 'remember',
    key: 'remember',
    order: 1,
    label: 'Recordar',
    shortLabel: 'Recordar',
    englishLabel: 'Remember',
    cognitiveWeight: 1.0,
    defaultIrtDifficulty: -1.6,
    color: '#475569',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    verbs: ['Identificar', 'Definir', 'Reconocer', 'Listar'],
    description:
      'Reconocer conceptos base, granularidad de tablas, sintaxis SQL esencial y componentes de arquitectura de datos.',
  },
  {
    id: 'understand',
    key: 'understand',
    order: 2,
    label: 'Comprender',
    shortLabel: 'Comprender',
    englishLabel: 'Understand',
    cognitiveWeight: 1.15,
    defaultIrtDifficulty: -0.8,
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    verbs: ['Explicar', 'Comparar', 'Clasificar', 'Interpretar'],
    description:
      'Explicar por qué ocurren fenómenos como el Fan-Out en JOINs, la Paradoja de Simpson o la compresión columnar en Parquet.',
  },
  {
    id: 'apply',
    key: 'apply',
    order: 3,
    label: 'Aplicar',
    shortLabel: 'Aplicar',
    englishLabel: 'Apply',
    cognitiveWeight: 1.35,
    defaultIrtDifficulty: -0.1,
    color: '#047857',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    verbs: ['Implementar', 'Ejecutar', 'Resolver', 'Construir'],
    description:
      'Escribir consultas con CTEs pre-agregadas, funciones de ventana (QUALIFY, ASOF JOIN) y transformaciones reproducibles.',
  },
  {
    id: 'analyze',
    key: 'analyze',
    order: 4,
    label: 'Analizar',
    shortLabel: 'Analizar',
    englishLabel: 'Analyze',
    cognitiveWeight: 1.55,
    defaultIrtDifficulty: 0.7,
    color: '#0E7490',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    verbs: ['Diagnosticar', 'Descomponer', 'Contrastar', 'Investigar'],
    description:
      'Diagnosticar cuellos de botella en motores vectorizados (DuckDB/Polars), cambios de mix en cohortes y sesgos en experimentos A/B.',
  },
  {
    id: 'evaluate',
    key: 'evaluate',
    order: 5,
    label: 'Evaluar',
    shortLabel: 'Evaluar',
    englishLabel: 'Evaluate',
    cognitiveWeight: 1.8,
    defaultIrtDifficulty: 1.4,
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    verbs: ['Auditar', 'Justificar', 'Validar', 'Criticar'],
    description:
      'Auditar contratos de datos (ODCS), evaluar trade-offs entre Star Schema y OBT, y validar reducción de varianza con CUPED.',
  },
  {
    id: 'create',
    key: 'create',
    order: 6,
    label: 'Crear',
    shortLabel: 'Crear',
    englishLabel: 'Create',
    cognitiveWeight: 2.0,
    defaultIrtDifficulty: 2.1,
    color: '#6D28D9',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    verbs: ['Diseñar', 'Arquitectar', 'Orquestar', 'Sintetizar'],
    description:
      'Arquitectar un Lakehouse en Apache Iceberg v3, gobernar una Capa Semántica BI-as-Code e integrar agentes de IA vía MCP.',
  },
];

/**
 * Ordered array of Bloom's Revised Taxonomy cognitive levels (`remember` -> `create`).
 * Also supports direct property lookup (e.g., `BLOOM_LEVELS.remember`, `BLOOM_LEVELS.apply`)
 * via non-enumerable properties so array iteration remains 100% pure.
 */
export const BLOOM_LEVELS = (() => {
  const arr = BLOOM_LEVEL_DEFINITIONS.map((lvl) => Object.freeze({ ...lvl }));
  for (const lvl of arr) {
    Object.defineProperty(arr, lvl.id, {
      value: lvl,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  }
  return Object.freeze(arr);
})();

export const BLOOM_LEVEL_MAP = Object.freeze(
  BLOOM_LEVEL_DEFINITIONS.reduce((acc, lvl) => {
    acc[lvl.id] = lvl;
    return acc;
  }, {})
);

export const LEARNING_PATH_MODES = Object.freeze({
  standard: {
    id: 'standard',
    label: 'Progresión Guiada (ZPD)',
    badge: 'ZPD Óptimo',
    description:
      'Secuencia calibrada en tu Zona de Desarrollo Próximo para consolidar fundamentos antes de escalar la complejidad.',
  },
  remediation: {
    id: 'remediation',
    label: 'Refuerzo Focalizado',
    badge: 'Refuerzo Activo',
    description:
      'Prioriza cerrar brechas detectadas en checkpoints o ejercicios prácticos antes de desbloquear arquitectura avanzada.',
  },
  accelerated: {
    id: 'accelerated',
    label: 'Vía Rápida Adaptativa',
    badge: 'Ruta Acelerada',
    description:
      'Tu alta precisión y nivel de habilidad (IRT) desbloquean módulos intermedios y avanzados de forma anticipada.',
  },
  specialized: {
    id: 'specialized',
    label: 'Ruta Especializada por Rol',
    badge: 'Enfoque de Rol',
    description:
      'Adapta el orden de estudio priorizando tu disciplina objetivo (DE, DA o BI) sin perder la visión integrada.',
  },
  mastery_review: {
    id: 'mastery_review',
    label: 'Dominio Completo y Práctica Continua',
    badge: 'Ruta Completada',
    description:
      'Has completado el currículo nuclear; se recomiendan repasos espaciados en niveles cognitivos superiores (Evaluar y Crear).',
  },
});

// ============================================================================
// INTERNAL CURRICULUM METADATA & DETERMINISTIC INFERENCE HELPERS
// ============================================================================

/**
 * Curated pedagogical profiles for known lessons (supports both 12-lesson and 18-lesson variants).
 * Any unknown or newly added lesson automatically falls back to deterministic inference.
 */
const KNOWN_LESSON_PROFILES = Object.freeze({
  'l1-joins-fanout': {
    bloomLevel: 'remember',
    irtDifficulty: -1.5,
    discrimination: 1.2,
    prerequisites: [],
    disciplineWeights: { DE: 0.9, DA: 1.0, BI: 0.85 },
  },
  'l2-window-functions': {
    bloomLevel: 'apply',
    irtDifficulty: -1.0,
    discrimination: 1.3,
    prerequisites: ['l1-joins-fanout'],
    disciplineWeights: { DE: 0.95, DA: 1.0, BI: 0.75 },
  },
  'l3-dimensional-modeling': {
    bloomLevel: 'understand',
    irtDifficulty: -0.6,
    discrimination: 1.2,
    prerequisites: ['l1-joins-fanout'],
    disciplineWeights: { DE: 1.0, DA: 0.75, BI: 0.95 },
  },
  'l4-metrics-simpson': {
    bloomLevel: 'analyze',
    irtDifficulty: -0.2,
    discrimination: 1.35,
    prerequisites: ['l1-joins-fanout', 'l2-window-functions'],
    disciplineWeights: { DE: 0.55, DA: 1.0, BI: 0.95 },
  },
  'l5-columnar-parquet': {
    bloomLevel: 'understand',
    irtDifficulty: -0.3,
    discrimination: 1.2,
    prerequisites: ['l3-dimensional-modeling'],
    disciplineWeights: { DE: 1.0, DA: 0.65, BI: 0.5 },
  },
  'l6-duckdb-polars-arrow': {
    bloomLevel: 'apply',
    irtDifficulty: 0.2,
    discrimination: 1.3,
    prerequisites: ['l2-window-functions', 'l5-columnar-parquet'],
    disciplineWeights: { DE: 1.0, DA: 0.9, BI: 0.55 },
  },
  'l7-iceberg-lakehouse': {
    bloomLevel: 'analyze',
    irtDifficulty: 0.6,
    discrimination: 1.35,
    prerequisites: ['l3-dimensional-modeling', 'l5-columnar-parquet'],
    disciplineWeights: { DE: 1.0, DA: 0.6, BI: 0.65 },
  },
  'l8-semantic-contracts': {
    bloomLevel: 'evaluate',
    irtDifficulty: 1.0,
    discrimination: 1.4,
    prerequisites: ['l3-dimensional-modeling', 'l4-metrics-simpson'],
    disciplineWeights: { DE: 0.9, DA: 0.75, BI: 1.0 },
  },
  'l9-ab-testing-cuped': {
    bloomLevel: 'evaluate',
    irtDifficulty: 1.2,
    discrimination: 1.45,
    prerequisites: ['l4-metrics-simpson'],
    disciplineWeights: { DE: 0.55, DA: 1.0, BI: 0.8 },
  },
  'l10-bi-viz-code': {
    bloomLevel: 'create',
    irtDifficulty: 1.1,
    discrimination: 1.25,
    prerequisites: ['l4-metrics-simpson', 'l8-semantic-contracts'],
    disciplineWeights: { DE: 0.5, DA: 0.85, BI: 1.0 },
  },
  'l11-streaming-watermarks': {
    bloomLevel: 'evaluate',
    irtDifficulty: 1.6,
    discrimination: 1.4,
    prerequisites: ['l6-duckdb-polars-arrow', 'l7-iceberg-lakehouse'],
    disciplineWeights: { DE: 1.0, DA: 0.65, BI: 0.55 },
  },
  'l12-mcp-ai-agents': {
    bloomLevel: 'create',
    irtDifficulty: 2.0,
    discrimination: 1.45,
    prerequisites: ['l8-semantic-contracts', 'l10-bi-viz-code'],
    disciplineWeights: { DE: 0.9, DA: 0.85, BI: 1.0 },
  },
});

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Maps a textual or numeric difficulty indicator to the IRT [-3.0, +3.0] logit scale.
 */
function normalizeDifficultyToIRT(rawDifficulty, fallbackIndex = 0, totalItems = 18) {
  if (typeof rawDifficulty === 'number' && Number.isFinite(rawDifficulty)) {
    // If given on a 0..100 scale, convert to [-3, +3]
    if (rawDifficulty > 3.0 && rawDifficulty <= 100) {
      return clamp((rawDifficulty / 100) * 6.0 - 3.0, -3.0, 3.0);
    }
    return clamp(rawDifficulty, -3.0, 3.0);
  }

  if (typeof rawDifficulty === 'string') {
    const norm = rawDifficulty.trim().toLowerCase();
    if (BLOOM_LEVEL_MAP[norm]) {
      return BLOOM_LEVEL_MAP[norm].defaultIrtDifficulty;
    }
    if (norm.includes('fundamento') || norm === 'beginner' || norm === 'básico' || norm === 'basico' || norm === 'easy') {
      return -1.2;
    }
    if (norm.includes('intermedio') || norm === 'intermediate' || norm === 'medium') {
      return 0.0;
    }
    if (norm.includes('avanzado') || norm === 'advanced' || norm === 'hard') {
      return 1.1;
    }
    if (norm.includes('frontera') || norm.includes('experto') || norm === 'expert') {
      return 1.9;
    }
  }

  // Deterministic progression across the 18-lesson curriculum from -1.6 to +2.1
  const safeTotal = Math.max(1, totalItems - 1);
  const ratio = clamp(fallbackIndex / safeTotal, 0, 1);
  return roundTo(-1.6 + ratio * 3.7, 2);
}

/**
 * Infers Bloom cognitive level ID ('remember' .. 'create') for a lesson when not explicitly set.
 */
function inferBloomLevelId(lesson, index = 0, totalLessons = 18) {
  if (lesson && typeof lesson.bloomLevel === 'string') {
    const key = lesson.bloomLevel.trim().toLowerCase();
    if (BLOOM_LEVEL_MAP[key]) return key;
  }
  if (lesson && typeof lesson.bloom === 'string') {
    const key = lesson.bloom.trim().toLowerCase();
    if (BLOOM_LEVEL_MAP[key]) return key;
  }
  if (lesson?.id && KNOWN_LESSON_PROFILES[lesson.id]?.bloomLevel) {
    return KNOWN_LESSON_PROFILES[lesson.id].bloomLevel;
  }

  const orderIndex = typeof lesson?.order === 'number' ? Math.max(0, lesson.order - 1) : index;
  const safeTotal = Math.max(6, totalLessons || 18);
  const bucket = Math.min(
    BLOOM_LEVELS.length - 1,
    Math.floor((orderIndex / safeTotal) * BLOOM_LEVELS.length)
  );
  return BLOOM_LEVELS[bucket].id;
}

/**
 * Computes normalized discipline weights `{ DE, DA, BI }` for a lesson.
 */
function inferDisciplineWeights(lesson) {
  if (lesson?.disciplineWeights && typeof lesson.disciplineWeights === 'object') {
    return {
      DE: clamp(Number(lesson.disciplineWeights.DE ?? 0.5), 0.1, 1.0),
      DA: clamp(Number(lesson.disciplineWeights.DA ?? 0.5), 0.1, 1.0),
      BI: clamp(Number(lesson.disciplineWeights.BI ?? 0.5), 0.1, 1.0),
    };
  }

  if (lesson?.id && KNOWN_LESSON_PROFILES[lesson.id]?.disciplineWeights) {
    return { ...KNOWN_LESSON_PROFILES[lesson.id].disciplineWeights };
  }

  const weights = { DE: 0.35, DA: 0.35, BI: 0.35 };
  const focus = Array.isArray(lesson?.coreFocus) ? lesson.coreFocus : [];
  const positionalMultipliers = [1.0, 0.72, 0.48];

  focus.forEach((role, idx) => {
    const key = String(role).toUpperCase();
    if (key in weights) {
      weights[key] = positionalMultipliers[idx] ?? 0.48;
    }
  });

  // Keyword refinement from title/goal for any newly added lessons (e.g., lessons 13..18)
  const text = `${lesson?.id || ''} ${lesson?.title || ''} ${lesson?.goal || ''}`.toLowerCase();
  if (/(pipeline|iceberg|parquet|arrow|kafka|flink|streaming|cdc|dbt|sqlmesh|ingesta|lakehouse|orquest)/.test(text)) {
    weights.DE = Math.max(weights.DE, 0.95);
  }
  if (/(cohorte|experimento|cuped|estadístic|estadistic|hipótesis|hipotesis|simpson|varianza|analític|retención)/.test(text)) {
    weights.DA = Math.max(weights.DA, 0.95);
  }
  if (/(semántic|semantic|kpi|dashboard|tufte|visual|bi-as-code|ejecutiv|métrica|negocio|gobierno)/.test(text)) {
    weights.BI = Math.max(weights.BI, 0.95);
  }

  return weights;
}

/**
 * Extracts enriched adaptive metadata for a lesson in a deterministic, non-mutating manner.
 */
export function getLessonAdaptiveMetadata(lesson, index = 0, allLessons = []) {
  const totalLessons = Array.isArray(allLessons) && allLessons.length > 0 ? allLessons.length : 18;
  const known = lesson?.id ? KNOWN_LESSON_PROFILES[lesson.id] : null;
  const bloomLevel = inferBloomLevelId(lesson, index, totalLessons);
  const bloomMeta = BLOOM_LEVEL_MAP[bloomLevel] || BLOOM_LEVELS[0];

  const irtDifficulty =
    typeof lesson?.irtDifficulty === 'number'
      ? clamp(lesson.irtDifficulty, -3.0, 3.0)
      : typeof lesson?.difficultyIrt === 'number'
        ? clamp(lesson.difficultyIrt, -3.0, 3.0)
        : known?.irtDifficulty ??
          normalizeDifficultyToIRT(lesson?.difficulty ?? lesson?.level, index, totalLessons);

  const discrimination = clamp(
    Number(lesson?.discrimination ?? known?.discrimination ?? 1.2),
    0.4,
    2.5
  );

  // Determine valid prerequisite IDs (only referencing lessons that actually exist in `allLessons`)
  const validIds = new Set(allLessons.map((l) => l?.id).filter(Boolean));
  let prerequisites = [];

  if (Array.isArray(lesson?.prerequisites)) {
    prerequisites = lesson.prerequisites.filter((id) => validIds.size === 0 || validIds.has(id));
  } else if (known?.prerequisites) {
    prerequisites = known.prerequisites.filter((id) => validIds.size === 0 || validIds.has(id));
  } else if (index > 0 && Array.isArray(allLessons) && allLessons[index - 1]?.id) {
    // Default sequential scaffolding: previous stage/lesson acts as soft prerequisite
    const prevLesson = allLessons[index - 1];
    prerequisites = [prevLesson.id];
  }

  return {
    id: lesson?.id || `lesson-${index + 1}`,
    order: lesson?.order ?? index + 1,
    bloomLevel,
    bloomOrder: bloomMeta.order,
    bloomLabel: bloomMeta.label,
    irtDifficulty: roundTo(irtDifficulty, 2),
    discrimination: roundTo(discrimination, 2),
    prerequisites,
    disciplineWeights: inferDisciplineWeights(lesson),
  };
}

// ============================================================================
// 2. ITEM RESPONSE THEORY (1PL / 2PL LOGISTIC MODEL) ABILITY ESTIMATION
// ============================================================================

/**
 * 2PL Logistic Item Characteristic Curve (reduces to 1PL Rasch when `a = 1.0`):
 * P(u = 1 | theta, a, b) = 1 / (1 + exp(-a * (theta - b)))
 */
function irtProbability2PL(theta, difficultyB = 0.0, discriminationA = 1.0) {
  const z = clamp(discriminationA * (theta - difficultyB), -20, 20);
  return 1.0 / (1.0 + Math.exp(-z));
}

/**
 * Normalizes flexible attempt structures (Array of attempt objects, or quizScores map)
 * into clean IRT response tuples `{ isCorrect, responseScore, b, a }`.
 */
function normalizeIRTAttempts(attempts) {
  if (!attempts) return [];

  let rawList = [];
  if (Array.isArray(attempts)) {
    rawList = attempts;
  } else if (typeof attempts === 'object') {
    rawList = Object.entries(attempts).map(([id, val]) => {
      if (val && typeof val === 'object') {
        return { id, lessonId: id, ...val };
      }
      return { id, lessonId: id, value: val };
    });
  }

  const normalized = [];
  rawList.forEach((item, idx) => {
    if (item === null || item === undefined) return;

    let responseScore = null;
    let isCorrect = false;

    if (typeof item === 'boolean') {
      isCorrect = item;
      responseScore = item ? 1.0 : 0.0;
    } else if (typeof item === 'number' && Number.isFinite(item)) {
      const scaled = item > 1.0 ? clamp(item / 100, 0, 1) : clamp(item, 0, 1);
      responseScore = scaled;
      isCorrect = scaled >= 0.7;
    } else if (typeof item === 'object') {
      if (typeof item.isCorrect === 'boolean') {
        isCorrect = item.isCorrect;
        responseScore = isCorrect ? 1.0 : 0.0;
      } else if (typeof item.correct === 'boolean') {
        isCorrect = item.correct;
        responseScore = isCorrect ? 1.0 : 0.0;
      } else if (typeof item.passed === 'boolean') {
        isCorrect = item.passed;
        responseScore = isCorrect ? 1.0 : 0.0;
      } else if (typeof item.score === 'number' && Number.isFinite(item.score)) {
        const scaled = item.score > 1.0 ? clamp(item.score / 100, 0, 1) : clamp(item.score, 0, 1);
        responseScore = scaled;
        isCorrect = scaled >= 0.7;
      } else if (typeof item.value === 'boolean') {
        isCorrect = item.value;
        responseScore = item.value ? 1.0 : 0.0;
      } else if (typeof item.value === 'number' && Number.isFinite(item.value)) {
        const scaled = item.value > 1.0 ? clamp(item.value / 100, 0, 1) : clamp(item.value, 0, 1);
        responseScore = scaled;
        isCorrect = scaled >= 0.7;
      } else {
        return;
      }

      // Slight attenuation if hint was used or excessive retries occurred
      if (isCorrect && item.hintUsed) {
        responseScore = Math.max(0.65, responseScore - 0.15);
      }
      if (isCorrect && typeof item.attempts === 'number' && item.attempts > 1) {
        const penalty = Math.min(0.25, (item.attempts - 1) * 0.08);
        responseScore = Math.max(0.65, responseScore - penalty);
      }
    }

    if (responseScore === null) return;

    const lessonId = item?.lessonId || item?.objectiveId || item?.id;
    const knownProfile = lessonId ? KNOWN_LESSON_PROFILES[lessonId] : null;

    const b =
      typeof item?.difficultyIrt === 'number'
        ? clamp(item.difficultyIrt, -3.0, 3.0)
        : typeof item?.irtDifficulty === 'number'
          ? clamp(item.irtDifficulty, -3.0, 3.0)
          : typeof item?.b === 'number'
            ? clamp(item.b, -3.0, 3.0)
            : knownProfile
              ? knownProfile.irtDifficulty
              : normalizeDifficultyToIRT(
                  item?.difficulty ?? item?.level ?? item?.bloomLevel,
                  idx,
                  Math.max(6, rawList.length)
                );

    const a = clamp(
      Number(
        item?.discrimination ??
          item?.a ??
          knownProfile?.discrimination ??
          1.0
      ),
      0.35,
      2.5
    );

    normalized.push({
      isCorrect,
      responseScore: clamp(responseScore, 0, 1),
      b,
      a,
    });
  });

  return normalized;
}

/**
 * Estimates student latent ability (`theta` in [-3.0, +3.0]) and normalized 0-100 mastery score
 * using Item Response Theory (1PL/2PL Logistic Model with Maximum A Posteriori Newton-Raphson).
 *
 * @param {Array|Object} attempts - Array of attempt objects or map of quiz/code attempt results.
 * @returns {{
 *   theta: number,
 *   masteryScore: number,
 *   score: number,
 *   normalizedScore: number,
 *   standardError: number,
 *   confidence: number,
 *   totalAttempts: number,
 *   correctAttempts: number,
 *   accuracy: number,
 *   model: '1PL' | '2PL',
 *   abilityBand: string,
 *   abilityLabel: string,
 *   recommendedBloom: string,
 *   zpdDifficultyRange: [number, number]
 * }}
 */
export function estimateAbilityIRT(attempts = []) {
  const items = normalizeIRTAttempts(attempts);
  const totalAttempts = items.length;

  if (totalAttempts === 0) {
    return {
      theta: 0.0,
      masteryScore: 50,
      score: 50,
      normalizedScore: 50,
      standardError: 1.5,
      confidence: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      model: '1PL',
      abilityBand: 'foundational',
      abilityLabel: 'Fundamentos en Progreso',
      recommendedBloom: 'understand',
      zpdDifficultyRange: [-0.8, 0.5],
    };
  }

  const correctAttempts = items.filter((it) => it.isCorrect).length;
  const accuracy = Math.round((correctAttempts / totalAttempts) * 100);
  const has2PL = items.some((it) => Math.abs(it.a - 1.0) > 0.01);

  // Gaussian prior N(0, sigma0^2) for Bayes Modal (MAP) stability on extreme response vectors
  const priorMean = 0.0;
  const priorVariance = 3.25; // Wide enough to allow theta to approach [-3, +3] with sufficient evidence
  const priorPrecision = 1.0 / priorVariance;

  let theta = 0.0;
  const maxIterations = 30;
  const tolerance = 1e-5;

  for (let iter = 0; iter < maxIterations; iter += 1) {
    let gradient = -(theta - priorMean) * priorPrecision;
    let fisherInfo = priorPrecision;

    for (let i = 0; i < totalAttempts; i += 1) {
      const { responseScore, b, a } = items[i];
      const p = irtProbability2PL(theta, b, a);
      const q = 1.0 - p;
      gradient += a * (responseScore - p);
      fisherInfo += a * a * p * q;
    }

    if (fisherInfo <= 1e-7) break;
    const delta = clamp(gradient / fisherInfo, -1.0, 1.0);
    theta = clamp(theta + delta, -3.0, 3.0);

    if (Math.abs(delta) < tolerance) break;
  }

  // Final Fisher Information at converged theta
  let totalInformation = priorPrecision;
  for (let i = 0; i < totalAttempts; i += 1) {
    const { b, a } = items[i];
    const p = irtProbability2PL(theta, b, a);
    totalInformation += a * a * p * (1.0 - p);
  }

  const standardError = roundTo(1.0 / Math.sqrt(Math.max(0.1, totalInformation)), 2);
  const roundedTheta = roundTo(clamp(theta, -3.0, 3.0), 2);
  const masteryScore = clamp(Math.round(((roundedTheta + 3.0) / 6.0) * 100), 0, 100);

  // Confidence scales from 0..100 based on information gain relative to prior precision
  const infoGainRatio = clamp((totalInformation - priorPrecision) / 6.0, 0, 1);
  const confidence = Math.round(infoGainRatio * 100);

  let abilityBand = 'foundational';
  let abilityLabel = 'Fundamentos';
  let recommendedBloom = 'understand';

  if (roundedTheta < -1.0) {
    abilityBand = 'novice';
    abilityLabel = 'Iniciación Analítica';
    recommendedBloom = 'remember';
  } else if (roundedTheta < -0.15) {
    abilityBand = 'foundational';
    abilityLabel = 'Fundamentos Sólidos';
    recommendedBloom = 'understand';
  } else if (roundedTheta < 0.75) {
    abilityBand = 'intermediate';
    abilityLabel = 'Competencia Aplicada';
    recommendedBloom = 'apply';
  } else if (roundedTheta < 1.65) {
    abilityBand = 'advanced';
    abilityLabel = 'Dominio Analítico y Arquitectónico';
    recommendedBloom = 'evaluate';
  } else {
    abilityBand = 'expert';
    abilityLabel = 'Frontera Senior (DE · DA · BI)';
    recommendedBloom = 'create';
  }

  // Zone of Proximal Development (ZPD) targets slightly above current theta: [theta - 0.25, theta + 0.85]
  const zpdLow = roundTo(clamp(roundedTheta - 0.25, -3.0, 2.5), 2);
  const zpdHigh = roundTo(clamp(roundedTheta + 0.85, -2.2, 3.0), 2);

  return {
    theta: roundedTheta,
    masteryScore,
    score: masteryScore,
    normalizedScore: masteryScore,
    standardError,
    confidence,
    totalAttempts,
    correctAttempts,
    accuracy,
    model: has2PL ? '2PL' : '1PL',
    abilityBand,
    abilityLabel,
    recommendedBloom,
    zpdDifficultyRange: [zpdLow, zpdHigh],
  };
}

// ============================================================================
// 3. DISCIPLINE (DE, DA, BI) & BLOOM TAXONOMY MASTERY ANALYTICS
// ============================================================================

/**
 * Evaluates a lesson's quiz outcome from flexible `quizScores` representations:
 * - boolean (`true` / `false`)
 * - number (`0..100` or `0..1`)
 * - option ID string (`'a'`, `'b'`, `'c'` matched against `lesson.checkpoint.options`)
 * - object (`{ isCorrect, correct, score, selectedOptionId }`)
 */
function evaluateLessonQuizStatus(lesson, rawQuizEntry) {
  if (rawQuizEntry === undefined || rawQuizEntry === null) {
    return { attempted: false, isCorrect: false, scoreNormalized: null };
  }

  if (typeof rawQuizEntry === 'boolean') {
    return {
      attempted: true,
      isCorrect: rawQuizEntry,
      scoreNormalized: rawQuizEntry ? 1.0 : 0.0,
    };
  }

  if (typeof rawQuizEntry === 'number' && Number.isFinite(rawQuizEntry)) {
    const norm = rawQuizEntry > 1.0 ? clamp(rawQuizEntry / 100, 0, 1) : clamp(rawQuizEntry, 0, 1);
    return {
      attempted: true,
      isCorrect: norm >= 0.7,
      scoreNormalized: norm,
    };
  }

  if (typeof rawQuizEntry === 'string') {
    const trimmed = rawQuizEntry.trim();
    if (!trimmed) return { attempted: false, isCorrect: false, scoreNormalized: null };

    const options = lesson?.checkpoint?.options;
    if (Array.isArray(options)) {
      const matched = options.find((opt) => opt.id === trimmed);
      if (matched) {
        const isCorrect = Boolean(matched.correct);
        return {
          attempted: true,
          isCorrect,
          scoreNormalized: isCorrect ? 1.0 : 0.0,
        };
      }
    }
    const isTruthyString = trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'correct';
    return {
      attempted: true,
      isCorrect: isTruthyString,
      scoreNormalized: isTruthyString ? 1.0 : 0.0,
    };
  }

  if (typeof rawQuizEntry === 'object') {
    if (typeof rawQuizEntry.isCorrect === 'boolean') {
      return {
        attempted: true,
        isCorrect: rawQuizEntry.isCorrect,
        scoreNormalized: rawQuizEntry.isCorrect ? 1.0 : 0.0,
      };
    }
    if (typeof rawQuizEntry.correct === 'boolean') {
      return {
        attempted: true,
        isCorrect: rawQuizEntry.correct,
        scoreNormalized: rawQuizEntry.correct ? 1.0 : 0.0,
      };
    }
    if (typeof rawQuizEntry.score === 'number' && Number.isFinite(rawQuizEntry.score)) {
      const norm =
        rawQuizEntry.score > 1.0
          ? clamp(rawQuizEntry.score / 100, 0, 1)
          : clamp(rawQuizEntry.score, 0, 1);
      return {
        attempted: true,
        isCorrect: norm >= 0.7,
        scoreNormalized: norm,
      };
    }
    if (typeof rawQuizEntry.optionId === 'string' || typeof rawQuizEntry.selectedOptionId === 'string') {
      return evaluateLessonQuizStatus(
        lesson,
        rawQuizEntry.optionId || rawQuizEntry.selectedOptionId
      );
    }
  }

  return { attempted: false, isCorrect: false, scoreNormalized: null };
}

/**
 * Evaluates a lesson's interactive code/playground attempt status from `codeAttempts`.
 */
function evaluateLessonCodeStatus(lessonId, codeAttempts) {
  if (!codeAttempts || !lessonId) {
    return { attempted: false, passed: false, scoreNormalized: null };
  }

  let entry = null;
  if (Array.isArray(codeAttempts)) {
    const matching = codeAttempts.filter((a) => (a?.lessonId || a?.id) === lessonId);
    if (matching.length > 0) entry = matching[matching.length - 1];
  } else if (typeof codeAttempts === 'object') {
    entry = codeAttempts[lessonId];
  }

  if (entry === undefined || entry === null) {
    return { attempted: false, passed: false, scoreNormalized: null };
  }

  if (typeof entry === 'boolean') {
    return { attempted: true, passed: entry, scoreNormalized: entry ? 1.0 : 0.25 };
  }
  if (typeof entry === 'number' && Number.isFinite(entry)) {
    if (entry <= 0) return { attempted: false, passed: false, scoreNormalized: null };
    // Could be a 0..100 score or a count of playground executions
    const norm = entry > 10 ? clamp(entry / 100, 0, 1) : clamp(0.6 + entry * 0.1, 0, 1);
    return { attempted: true, passed: norm >= 0.65, scoreNormalized: norm };
  }
  if (typeof entry === 'object') {
    const passed = Boolean(entry.passed ?? entry.isCorrect ?? entry.correct ?? (entry.score >= 70));
    const scoreNormalized =
      typeof entry.score === 'number'
        ? entry.score > 1
          ? clamp(entry.score / 100, 0, 1)
          : clamp(entry.score, 0, 1)
        : passed
          ? 1.0
          : 0.3;
    return { attempted: true, passed, scoreNormalized };
  }

  return { attempted: false, passed: false, scoreNormalized: null };
}

/**
 * Calculates mastery percentages (0-100) for `DE`, `DA`, `BI`, and `overall`,
 * plus a detailed breakdown across all 6 Bloom's Taxonomy cognitive levels.
 *
 * @param {Array} lessons - Array of curriculum lesson objects (18 lessons).
 * @param {Array|Set} completedIds - Completed lesson IDs.
 * @param {Object} quizScores - Map of lessonId -> quiz score / boolean / optionId / attempt object.
 * @param {Object|Array} codeAttempts - Map or array of interactive SQL/code playground attempts.
 * @returns {{
 *   DE: number,
 *   DA: number,
 *   BI: number,
 *   overall: number,
 *   bloom: Record<string, number>,
 *   byBloom: Record<string, Object>,
 *   bloomBreakdown: Array<Object>,
 *   disciplines: Record<'DE'|'DA'|'BI', Object>,
 *   irtAbility: Object,
 *   lessonMastery: Record<string, number>,
 *   completedCount: number,
 *   totalLessons: number,
 *   completionPercentage: number
 * }}
 */
export function calculateDisciplineMastery(
  lessons = [],
  completedIds = [],
  quizScores = {},
  codeAttempts = {}
) {
  const safeLessons =
    Array.isArray(lessons) && lessons.length > 0
      ? lessons
      : Object.keys(KNOWN_LESSON_PROFILES).map((id, idx) => ({
          id,
          order: idx + 1,
          ...KNOWN_LESSON_PROFILES[id],
        }));

  const completedSet = new Set(
    Array.isArray(completedIds)
      ? completedIds
      : completedIds instanceof Set
        ? Array.from(completedIds)
        : []
  );

  const safeQuizScores = quizScores && typeof quizScores === 'object' ? quizScores : {};
  const hasAnyQuizActivity = Object.keys(safeQuizScores).length > 0;
  const hasAnyCodeActivity =
    codeAttempts &&
    ((Array.isArray(codeAttempts) && codeAttempts.length > 0) ||
      (typeof codeAttempts === 'object' && Object.keys(codeAttempts).length > 0));

  const roleAccum = {
    DE: { weightedEarned: 0, totalWeight: 0, completedLessons: 0, primaryTotal: 0 },
    DA: { weightedEarned: 0, totalWeight: 0, completedLessons: 0, primaryTotal: 0 },
    BI: { weightedEarned: 0, totalWeight: 0, completedLessons: 0, primaryTotal: 0 },
  };

  const bloomAccum = BLOOM_LEVELS.reduce((acc, lvl) => {
    acc[lvl.id] = {
      ...lvl,
      earnedSum: 0,
      totalCount: 0,
      completedCount: 0,
      quizPassedCount: 0,
    };
    return acc;
  }, {});

  const lessonMastery = {};
  const irtAttempts = [];

  safeLessons.forEach((lesson, idx) => {
    const meta = getLessonAdaptiveMetadata(lesson, idx, safeLessons);
    const isCompleted = completedSet.has(meta.id);
    const quizStatus = evaluateLessonQuizStatus(lesson, safeQuizScores[meta.id]);
    const codeStatus = evaluateLessonCodeStatus(meta.id, codeAttempts);

    // Combine completion, formative checkpoint quiz, and code lab signals into [0, 1] mastery
    let masteryUnit = 0.0;

    if (isCompleted && quizStatus.attempted && codeStatus.attempted) {
      masteryUnit = 0.45 * 1.0 + 0.35 * quizStatus.scoreNormalized + 0.2 * codeStatus.scoreNormalized;
    } else if (isCompleted && quizStatus.attempted) {
      masteryUnit = quizStatus.isCorrect
        ? 1.0
        : 0.45 + 0.35 * quizStatus.scoreNormalized;
    } else if (isCompleted && codeStatus.attempted) {
      masteryUnit = 0.65 + 0.35 * codeStatus.scoreNormalized;
    } else if (isCompleted) {
      // Completed lesson; if no quizzes/code have been used anywhere yet, award full completion credit,
      // otherwise 0.88 to incentivize verifying with the checkpoint quiz.
      masteryUnit = !hasAnyQuizActivity && !hasAnyCodeActivity ? 1.0 : 0.88;
    } else if (quizStatus.attempted || codeStatus.attempted) {
      const qContribution = quizStatus.attempted ? quizStatus.scoreNormalized * 0.65 : 0;
      const cContribution = codeStatus.attempted ? codeStatus.scoreNormalized * 0.25 : 0;
      masteryUnit = clamp(qContribution + cContribution, 0.1, 0.78);
    }

    masteryUnit = clamp(masteryUnit, 0, 1);
    lessonMastery[meta.id] = Math.round(masteryUnit * 100);

    // Record attempt for IRT latent trait estimation
    if (quizStatus.attempted) {
      irtAttempts.push({
        lessonId: meta.id,
        isCorrect: quizStatus.isCorrect,
        score: quizStatus.scoreNormalized * 100,
        irtDifficulty: meta.irtDifficulty,
        discrimination: meta.discrimination,
      });
    } else if (codeStatus.attempted) {
      irtAttempts.push({
        lessonId: meta.id,
        isCorrect: codeStatus.passed,
        score: codeStatus.scoreNormalized * 100,
        irtDifficulty: meta.irtDifficulty,
        discrimination: meta.discrimination * 0.85,
      });
    } else if (isCompleted) {
      irtAttempts.push({
        lessonId: meta.id,
        isCorrect: true,
        score: 88,
        irtDifficulty: meta.irtDifficulty,
        discrimination: meta.discrimination * 0.75,
      });
    }

    // Accumulate discipline weights (DE, DA, BI)
    ['DE', 'DA', 'BI'].forEach((role) => {
      const w = meta.disciplineWeights[role] ?? 0.5;
      roleAccum[role].weightedEarned += w * masteryUnit;
      roleAccum[role].totalWeight += w;
      if (w >= 0.75) {
        roleAccum[role].primaryTotal += 1;
        if (isCompleted || masteryUnit >= 0.8) {
          roleAccum[role].completedLessons += 1;
        }
      }
    });

    // Accumulate Bloom taxonomy level breakdown
    const bloomBucket = bloomAccum[meta.bloomLevel] || bloomAccum.understand;
    bloomBucket.earnedSum += masteryUnit;
    bloomBucket.totalCount += 1;
    if (isCompleted || masteryUnit >= 0.85) {
      bloomBucket.completedCount += 1;
    }
    if (quizStatus.isCorrect) {
      bloomBucket.quizPassedCount += 1;
    }
  });

  const computeRolePercent = (roleKey) => {
    const { weightedEarned, totalWeight } = roleAccum[roleKey];
    if (totalWeight <= 0) return 0;
    return clamp(Math.round((weightedEarned / totalWeight) * 100), 0, 100);
  };

  const DE = computeRolePercent('DE');
  const DA = computeRolePercent('DA');
  const BI = computeRolePercent('BI');

  const totalLessons = safeLessons.length;
  const completedCount = safeLessons.filter((l) => completedSet.has(l?.id)).length;
  const completionPercentage =
    totalLessons > 0 ? clamp(Math.round((completedCount / totalLessons) * 100), 0, 100) : 0;

  // Overall mastery balances the 3 disciplines and cognitive depth across lessons
  const rawLessonAvg =
    totalLessons > 0
      ? Math.round(
          Object.values(lessonMastery).reduce((sum, val) => sum + val, 0) / totalLessons
        )
      : 0;
  const overall = clamp(Math.round(rawLessonAvg * 0.6 + ((DE + DA + BI) / 3) * 0.4), 0, 100);

  const bloom = {};
  const byBloom = {};
  const bloomBreakdown = BLOOM_LEVELS.map((lvl) => {
    const bucket = bloomAccum[lvl.id];
    const score =
      bucket.totalCount > 0
        ? clamp(Math.round((bucket.earnedSum / bucket.totalCount) * 100), 0, 100)
        : 0;

    let status = 'not_started';
    if (score >= 80) status = 'mastered';
    else if (score > 0 || bucket.completedCount > 0) status = 'in_progress';

    const entry = {
      id: lvl.id,
      key: lvl.key,
      order: lvl.order,
      label: lvl.label,
      shortLabel: lvl.shortLabel,
      description: lvl.description,
      color: lvl.color,
      bg: lvl.bg,
      border: lvl.border,
      score,
      mastery: score,
      percentage: score,
      completed: bucket.completedCount,
      total: bucket.totalCount,
      quizPassed: bucket.quizPassedCount,
      status,
    };

    bloom[lvl.id] = score;
    byBloom[lvl.id] = entry;
    return entry;
  });

  const getRoleStatus = (score) => {
    if (score >= 80) return 'Dominio Avanzado';
    if (score >= 45) return 'En Consolidación';
    if (score > 0) return 'En Progreso Inicial';
    return 'Sin Iniciar';
  };

  const disciplines = {
    DE: {
      id: 'DE',
      label: 'Ingeniería de Datos',
      score: DE,
      mastery: DE,
      percentage: DE,
      completedLessons: roleAccum.DE.completedLessons,
      totalLessons: roleAccum.DE.primaryTotal || totalLessons,
      status: getRoleStatus(DE),
    },
    DA: {
      id: 'DA',
      label: 'Análisis de Datos',
      score: DA,
      mastery: DA,
      percentage: DA,
      completedLessons: roleAccum.DA.completedLessons,
      totalLessons: roleAccum.DA.primaryTotal || totalLessons,
      status: getRoleStatus(DA),
    },
    BI: {
      id: 'BI',
      label: 'Business Intelligence',
      score: BI,
      mastery: BI,
      percentage: BI,
      completedLessons: roleAccum.BI.completedLessons,
      totalLessons: roleAccum.BI.primaryTotal || totalLessons,
      status: getRoleStatus(BI),
    },
  };

  const irtAbility = estimateAbilityIRT(irtAttempts);

  return {
    DE,
    DA,
    BI,
    overall,
    bloom,
    byBloom,
    bloomBreakdown,
    disciplines,
    irtAbility,
    lessonMastery,
    completedCount,
    totalLessons,
    completionPercentage,
  };
}

// ============================================================================
// 4. ZONE OF PROXIMAL DEVELOPMENT (ZPD) & PREREQUISITE RECOMMENDATIONS
// ============================================================================

/**
 * Generates personalized adaptive learning recommendations using Vygotsky's
 * Zone of Proximal Development (ZPD), Item Response Theory (IRT), and prerequisite DAG checking.
 *
 * @param {Array} lessons - Curriculum lessons array (18 lessons).
 * @param {Array|Set} completedIds - Completed lesson IDs.
 * @param {Object} quizScores - Map of lessonId -> quiz score / boolean / optionId / attempt object.
 * @param {Object} diagnosticProfile - Optional learner profile (`{ targetRole, experienceLevel, diagnosticScore, priorTheta }`).
 * @returns {{
 *   nextPrimaryLesson: Object | null,
 *   remediationLessons: Array<Object>,
 *   acceleratedUnlockIds: Array<string>,
 *   learningPathMode: 'standard' | 'remediation' | 'accelerated' | 'specialized' | 'mastery_review',
 *   reason: string,
 *   modeMeta: Object,
 *   abilityEstimate: Object,
 *   zpdTargetDifficulty: number
 * }}
 */
export function getAdaptiveRecommendations(
  lessons = [],
  completedIds = [],
  quizScores = {},
  diagnosticProfile = {}
) {
  const safeLessons = Array.isArray(lessons) ? lessons : [];
  if (safeLessons.length === 0) {
    return {
      nextPrimaryLesson: null,
      remediationLessons: [],
      acceleratedUnlockIds: [],
      learningPathMode: 'standard',
      reason: 'No hay lecciones cargadas en el catálogo actual.',
      modeMeta: LEARNING_PATH_MODES.standard,
      abilityEstimate: estimateAbilityIRT([]),
      zpdTargetDifficulty: -1.0,
    };
  }

  const completedSet = new Set(
    Array.isArray(completedIds)
      ? completedIds
      : completedIds instanceof Set
        ? Array.from(completedIds)
        : []
  );
  const safeQuizScores = quizScores && typeof quizScores === 'object' ? quizScores : {};
  const profile = diagnosticProfile && typeof diagnosticProfile === 'object' ? diagnosticProfile : {};

  // Build lesson metadata and IRT attempts
  const metaById = {};
  const lessonById = {};
  const irtAttempts = [];

  // Incorporate optional prior diagnostic assessment into IRT attempt stream
  const targetRole = String(
    profile.targetRole || profile.preferredRole || profile.role || profile.focus || ''
  )
    .trim()
    .toUpperCase();
  const hasSpecificRoleFocus = ['DE', 'DA', 'BI'].includes(targetRole);

  const experienceRaw = String(profile.experienceLevel || profile.level || '').toLowerCase();
  if (typeof profile.diagnosticScore === 'number' && Number.isFinite(profile.diagnosticScore)) {
    const diagNorm = clamp(profile.diagnosticScore, 0, 100);
    irtAttempts.push(
      { score: diagNorm, irtDifficulty: -0.8, discrimination: 1.1 },
      { score: diagNorm, irtDifficulty: 0.4, discrimination: 1.2 }
    );
  } else if (experienceRaw.includes('avanzado') || experienceRaw === 'advanced' || experienceRaw === 'expert') {
    irtAttempts.push(
      { isCorrect: true, irtDifficulty: -0.5, discrimination: 1.1 },
      { isCorrect: true, irtDifficulty: 0.6, discrimination: 1.2 }
    );
  } else if (experienceRaw.includes('intermedio') || experienceRaw === 'intermediate') {
    irtAttempts.push({ isCorrect: true, irtDifficulty: -0.6, discrimination: 1.0 });
  }

  safeLessons.forEach((lesson, idx) => {
    const meta = getLessonAdaptiveMetadata(lesson, idx, safeLessons);
    metaById[meta.id] = meta;
    lessonById[meta.id] = lesson;

    const quizStatus = evaluateLessonQuizStatus(lesson, safeQuizScores[meta.id]);
    if (quizStatus.attempted) {
      irtAttempts.push({
        lessonId: meta.id,
        isCorrect: quizStatus.isCorrect,
        score: quizStatus.scoreNormalized * 100,
        irtDifficulty: meta.irtDifficulty,
        discrimination: meta.discrimination,
      });
    } else if (completedSet.has(meta.id)) {
      irtAttempts.push({
        lessonId: meta.id,
        isCorrect: true,
        score: 85,
        irtDifficulty: meta.irtDifficulty,
        discrimination: meta.discrimination * 0.7,
      });
    }
  });

  const abilityEstimate = estimateAbilityIRT(irtAttempts);
  const { theta } = abilityEstimate;

  // 1. Identify Remediation Needs (failed checkpoints or unmastered prerequisites of failed lessons)
  const remediationLessons = [];
  const remediationSeen = new Set();

  safeLessons.forEach((lesson, idx) => {
    const meta = metaById[lesson.id] || getLessonAdaptiveMetadata(lesson, idx, safeLessons);
    const quizStatus = evaluateLessonQuizStatus(lesson, safeQuizScores[meta.id]);

    if (quizStatus.attempted && !quizStatus.isCorrect) {
      // Check if an uncompleted prerequisite caused the struggle
      const missingPrereqs = meta.prerequisites.filter((prereqId) => !completedSet.has(prereqId));
      missingPrereqs.forEach((prereqId) => {
        if (!remediationSeen.has(prereqId) && lessonById[prereqId]) {
          remediationSeen.add(prereqId);
          remediationLessons.push({
            ...lessonById[prereqId],
            remediationType: 'missing_prerequisite',
            remediationReason: `Prerrequisito clave para superar "${lesson.title}".`,
            priority: 1,
          });
        }
      });

      if (!remediationSeen.has(meta.id)) {
        remediationSeen.add(meta.id);
        remediationLessons.push({
          ...lesson,
          remediationType: 'failed_checkpoint',
          remediationReason: `Checkpoint pendiente de consolidación en "${lesson.title}".`,
          priority: 2,
        });
      }
    }
  });

  // 2. Identify Accelerated Unlock IDs based on IRT Theta and ZPD
  const acceleratedUnlockIds = [];
  const isHighPerformer =
    theta >= 0.45 ||
    Boolean(profile.accelerated) ||
    experienceRaw.includes('avanzado') ||
    experienceRaw === 'advanced' ||
    (abilityEstimate.totalAttempts >= 2 && abilityEstimate.accuracy >= 85);

  if (isHighPerformer && remediationLessons.length === 0) {
    safeLessons.forEach((lesson) => {
      const meta = metaById[lesson.id];
      if (!meta || completedSet.has(meta.id)) return;

      // Unlock lessons within the upper Zone of Proximal Development window [theta - 0.5, theta + 1.35]
      const inAcceleratedWindow =
        meta.irtDifficulty >= -0.4 && meta.irtDifficulty <= theta + 1.35;
      const matchesRoleFocus =
        hasSpecificRoleFocus && (meta.disciplineWeights[targetRole] ?? 0) >= 0.85;

      if (inAcceleratedWindow || matchesRoleFocus) {
        acceleratedUnlockIds.push(meta.id);
      }
    });
  }

  const acceleratedSet = new Set(acceleratedUnlockIds);

  // 3. Determine Prerequisite Satisfaction for each uncompleted lesson
  const areDirectPrerequisitesMet = (meta) => {
    if (!meta.prerequisites || meta.prerequisites.length === 0) return true;
    return meta.prerequisites.every((prereqId) => {
      if (completedSet.has(prereqId)) return true;
      const prereqQuiz = evaluateLessonQuizStatus(lessonById[prereqId], safeQuizScores[prereqId]);
      return prereqQuiz.attempted && prereqQuiz.isCorrect;
    });
  };

  // 4. Determine Learning Path Mode
  const uncompletedLessons = safeLessons.filter((l) => !completedSet.has(l.id));
  let learningPathMode = 'standard';

  if (uncompletedLessons.length === 0 && remediationLessons.length === 0) {
    learningPathMode = 'mastery_review';
  } else if (remediationLessons.length > 0) {
    learningPathMode = 'remediation';
  } else if (isHighPerformer && acceleratedUnlockIds.length > 0) {
    learningPathMode = 'accelerated';
  } else if (hasSpecificRoleFocus) {
    learningPathMode = 'specialized';
  }

  // 5. Select `nextPrimaryLesson` via Zone of Proximal Development (ZPD) optimal challenge scoring
  // Anchor ZPD target to both latent ability (theta) and highest mastered difficulty so steps remain scaffolded
  const completedDifficulties = safeLessons
    .filter((l) => completedSet.has(l.id))
    .map((l) => metaById[l.id]?.irtDifficulty ?? -1.2);
  const maxCompletedDiff =
    completedDifficulties.length > 0 ? Math.max(...completedDifficulties) : -1.6;

  const zpdTargetDifficulty = roundTo(
    clamp(
      completedSet.size === 0 && abilityEstimate.totalAttempts === 0
        ? -1.45
        : Math.min(theta + 0.35, maxCompletedDiff + 0.75),
      -1.6,
      2.2
    ),
    2
  );

  let nextPrimaryLesson = null;
  let reason = '';

  if (learningPathMode === 'remediation' && remediationLessons.length > 0) {
    const topRemediation = remediationLessons[0];
    const meta = metaById[topRemediation.id];
    nextPrimaryLesson = {
      ...topRemediation,
      bloomLevel: meta?.bloomLevel,
      bloomLabel: meta?.bloomLabel,
      irtDifficulty: meta?.irtDifficulty,
    };
    reason =
      topRemediation.remediationType === 'missing_prerequisite'
        ? `Refuerzo recomendado: antes de avanzar, consolida "${topRemediation.title}" (nivel Bloom: ${meta?.bloomLabel || 'Comprender'}) para asegurar las bases del módulo.`
        : `Refuerzo focalizado: detectamos una oportunidad de mejora en el checkpoint de "${topRemediation.title}". Repasa el caso práctico y valida tu consulta SQL antes de subir de complejidad.`;
  } else if (learningPathMode === 'mastery_review') {
    // Recommend the highest cognitive level (Create / Evaluate) lesson for spaced synthesis review
    const reviewCandidate =
      safeLessons[safeLessons.length - 1] || safeLessons[0];
    const meta = metaById[reviewCandidate.id];
    nextPrimaryLesson = {
      ...reviewCandidate,
      bloomLevel: meta?.bloomLevel,
      bloomLabel: meta?.bloomLabel,
      irtDifficulty: meta?.irtDifficulty,
    };
    reason = `Has completado las ${safeLessons.length} lecciones de la ruta. Tu habilidad estimada IRT es θ = ${theta >= 0 ? `+${theta}` : theta} (${abilityEstimate.masteryScore}/100). Te sugerimos repasar "${reviewCandidate.title}" (nivel Bloom: ${meta?.bloomLabel || 'Crear'}) para afianzar patrones de frontera.`;
  } else {
    // Score all uncompleted lessons using ZPD proximity, prerequisite readiness, and role affinity
    const scoredCandidates = uncompletedLessons.map((lesson, idx) => {
      const meta = metaById[lesson.id] || getLessonAdaptiveMetadata(lesson, idx, safeLessons);
      const directPrereqsMet = areDirectPrerequisitesMet(meta);
      const isAcceleratedUnlocked = acceleratedSet.has(meta.id);

      // Distance from ZPD target difficulty (smaller distance = better ZPD match)
      const zpdDistance = Math.abs(meta.irtDifficulty - zpdTargetDifficulty);
      const zpdScore = Math.max(0, 100 - zpdDistance * 35);

      // Strong bonus if direct prerequisites are satisfied; moderate bonus if unlocked via acceleration
      const prereqBonus = directPrereqsMet ? 55 : isAcceleratedUnlocked ? 15 : -65;

      // Curriculum continuity bonus so learners progress coherently through stages
      const orderBonus = Math.max(0, 24 - (meta.order - 1) * 1.5);

      // Discipline affinity bonus when learner specified DE, DA, or BI focus
      const roleWeight = hasSpecificRoleFocus ? meta.disciplineWeights[targetRole] ?? 0.5 : 0.5;
      const roleBonus = hasSpecificRoleFocus ? roleWeight * 28 : 0;

      const totalScore = roundTo(zpdScore + prereqBonus + orderBonus + roleBonus, 2);

      return {
        lesson,
        meta,
        prereqsMet: directPrereqsMet || isAcceleratedUnlocked,
        zpdDistance: roundTo(zpdDistance, 2),
        totalScore,
      };
    });

    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore || a.meta.order - b.meta.order);
    const chosen = scoredCandidates[0];

    if (chosen) {
      nextPrimaryLesson = {
        ...chosen.lesson,
        bloomLevel: chosen.meta.bloomLevel,
        bloomLabel: chosen.meta.bloomLabel,
        irtDifficulty: chosen.meta.irtDifficulty,
        zpdMatchScore: Math.round(clamp(100 - chosen.zpdDistance * 25, 50, 99)),
      };

      if (learningPathMode === 'accelerated') {
        reason = `Vía Rápida (θ = ${theta >= 0 ? `+${theta}` : theta}, dominio ${abilityEstimate.masteryScore}%): tu precisión desbloquea ${acceleratedUnlockIds.length} módulos y sitúa "${chosen.lesson.title}" (Bloom: ${chosen.meta.bloomLabel}) en tu Zona de Desarrollo Próximo óptima.`;
      } else if (learningPathMode === 'specialized' && hasSpecificRoleFocus) {
        reason = `Ruta Especializada (${targetRole}): "${chosen.lesson.title}" tiene alta afinidad con ${targetRole}, cumple todos los prerrequisitos y se alinea con tu nivel cognitivo actual (${chosen.meta.bloomLabel}).`;
      } else {
        reason = `Zona de Desarrollo Próximo (ZPD): "${chosen.lesson.title}" es el siguiente paso óptimo con prerrequisitos verificados y nivel cognitivo "${chosen.meta.bloomLabel}" (dificultad IRT ${chosen.meta.irtDifficulty >= 0 ? `+${chosen.meta.irtDifficulty}` : chosen.meta.irtDifficulty}).`;
      }
    }
  }

  return {
    nextPrimaryLesson,
    remediationLessons,
    acceleratedUnlockIds,
    learningPathMode,
    reason,
    modeMeta: LEARNING_PATH_MODES[learningPathMode] || LEARNING_PATH_MODES.standard,
    abilityEstimate,
    zpdTargetDifficulty,
  };
}

export default {
  BLOOM_LEVELS,
  BLOOM_LEVEL_MAP,
  LEARNING_PATH_MODES,
  estimateAbilityIRT,
  calculateDisciplineMastery,
  getAdaptiveRecommendations,
  getLessonAdaptiveMetadata,
};
