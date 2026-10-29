import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PROMPTS_DIR = path.join(__dirname, 'prompts');

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY_MESSAGES = 12;
export const MAX_CODE_CHARS = 4000;
export const MAX_RESULT_ROWS = 50;
export const MAX_SELECTION_CHARS = 2000;
export const MAX_TOTAL_PROMPT_CHARS = 24_000;

export const MERCADO_BRISA_SCHEMA_SUMMARY =
  'customers (customer_id, full_name, city, signup_date), customer_changes (SCD2), products (product_id, sku, category, unit_price_usd), orders (order_id, customer_id, store_id, order_ts, shipping_fee_usd, order_total_usd), order_items (order_id, product_id, quantity, item_price_usd), payments (payment_id, order_id, method, amount_usd), refunds (refund_id, order_id, refund_usd, refund_ts), events (event_id, customer_id, event_type, event_ts), marketing_spend, experiments, experiment_assignments, stores, calendar';

const TRACK_NAMES = {
  core: 'Tronco común',
  de: 'Ingeniería de Datos',
  da: 'Análisis de Datos',
  bi: 'Business Intelligence',
  DE: 'Ingeniería de Datos',
  DA: 'Análisis de Datos',
  BI: 'Business Intelligence',
  '360': 'Tronco común',
  'DE + DA + BI': 'Tronco común',
};

/**
 * Elimina bytes nulos y caracteres de control peligrosos preservando saltos de línea y tabuladores.
 */
export function cleanControlChars(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

let cachedCatalogData = null;

/**
 * Carga las lecciones desde `src/data/lessons/index.js` (cuando T4 esté presente)
 * y mantiene fallback a `src/data/learningPath2026.js` + `src/data/catalog/modules.js`.
 */
export async function loadCurriculumData({ forceReload = false } = {}) {
  if (cachedCatalogData && !forceReload) {
    return cachedCatalogData;
  }

  let v2Lessons = [];
  let legacyLessons = [];
  let modules = [];
  let tracks = [];

  const v2IndexPath = path.join(PROJECT_ROOT, 'src', 'data', 'lessons', 'index.js');
  if (fs.existsSync(v2IndexPath)) {
    try {
      const mod = await import(pathToFileURL(v2IndexPath).href);
      if (Array.isArray(mod.LESSONS)) {
        v2Lessons = mod.LESSONS;
      }
      if (Array.isArray(mod.MODULES)) {
        modules = mod.MODULES;
      }
    } catch {}
  }

  const legacyPath = path.join(PROJECT_ROOT, 'src', 'data', 'learningPath2026.js');
  if (fs.existsSync(legacyPath)) {
    try {
      const legacyMod = await import(pathToFileURL(legacyPath).href);
      if (Array.isArray(legacyMod.LESSONS)) {
        legacyLessons = legacyMod.LESSONS;
      }
    } catch {}
  }

  if (modules.length === 0) {
    const catalogModulesPath = path.join(PROJECT_ROOT, 'src', 'data', 'catalog', 'modules.js');
    if (fs.existsSync(catalogModulesPath)) {
      try {
        const catMod = await import(pathToFileURL(catalogModulesPath).href);
        if (Array.isArray(catMod.MODULES)) {
          modules = catMod.MODULES;
        }
      } catch {}
    }
  }

  const catalogTracksPath = path.join(PROJECT_ROOT, 'src', 'data', 'catalog', 'tracks.js');
  if (fs.existsSync(catalogTracksPath)) {
    try {
      const trkMod = await import(pathToFileURL(catalogTracksPath).href);
      if (Array.isArray(trkMod.TRACKS)) {
        tracks = trkMod.TRACKS;
      }
    } catch {}
  }

  const lessonsById = new Map();
  for (const lesson of legacyLessons) {
    if (lesson?.id) lessonsById.set(lesson.id, lesson);
  }
  for (const lesson of v2Lessons) {
    if (lesson?.id) lessonsById.set(lesson.id, lesson);
    if (lesson?.legacyId) lessonsById.set(lesson.legacyId, lesson);
  }

  cachedCatalogData = {
    lessonsById,
    allLessons: [...v2Lessons, ...legacyLessons],
    modules,
    tracks,
  };
  return cachedCatalogData;
}

/**
 * Busca una lección y su sección en el catálogo del servidor a partir de `lessonId` y `sectionId`.
 */
export async function resolveLessonContext({
  lessonId,
  moduleTitle,
  sectionId,
  track,
  level,
  customLesson,
} = {}) {
  const data = await loadCurriculumData();
  let lesson = customLesson || null;

  if (!lesson && lessonId) {
    lesson = data.lessonsById.get(String(lessonId).trim()) || null;
  }

  if (!lesson && typeof moduleTitle === 'string' && moduleTitle.trim().length > 0) {
    const lowerTitle = moduleTitle.toLowerCase();
    lesson =
      data.allLessons.find(
        (l) => l.title && lowerTitle.includes(l.title.toLowerCase())
      ) || null;
  }

  // Si no está en lessonsById, buscar en catalog/modules.js por id de lección planificada o legacyId
  let parentModule = null;
  if (lessonId && Array.isArray(data.modules)) {
    for (const mod of data.modules) {
      const matched = mod.lessons?.find(
        (l) => l.id === lessonId || l.legacyId === lessonId
      );
      if (matched) {
        parentModule = mod;
        if (!lesson && matched.legacyId) {
          lesson = data.lessonsById.get(matched.legacyId) || null;
        }
        break;
      }
    }
  }

  if (!lesson && data.allLessons.length > 0) {
    lesson = data.allLessons[0];
  }

  const sections = Array.isArray(lesson?.sections) ? lesson.sections : [];
  let activeSection = sections[0] || null;

  if (sectionId !== undefined && sectionId !== null && sections.length > 0) {
    const rawSec = String(sectionId).trim();
    const byId = sections.find(
      (s, idx) =>
        (s.id && String(s.id) === rawSec) ||
        String(idx) === rawSec ||
        (s.heading && s.heading.toLowerCase().includes(rawSec.toLowerCase()))
    );
    if (byId) {
      activeSection = byId;
    } else {
      const numericIdx = Number(rawSec);
      if (Number.isInteger(numericIdx) && numericIdx >= 0 && numericIdx < sections.length) {
        activeSection = sections[numericIdx];
      }
    }
  }

  const resolvedLevel =
    typeof level === 'number' && Number.isFinite(level)
      ? level
      : typeof lesson?.level === 'number'
        ? lesson.level
        : typeof parentModule?.level === 'number'
          ? parentModule.level
          : 1;

  const rawTrack =
    track ||
    (Array.isArray(lesson?.tracks) ? lesson.tracks[0] : null) ||
    parentModule?.track ||
    (Array.isArray(lesson?.coreFocus) ? lesson.coreFocus[0] : 'core');

  const trackName = TRACK_NAMES[rawTrack] || TRACK_NAMES[String(rawTrack).toLowerCase()] || 'Tronco común';

  const objectivesList = Array.isArray(lesson?.objectives)
    ? lesson.objectives
    : lesson?.goal
      ? [lesson.goal]
      : parentModule?.goal
        ? [parentModule.goal]
        : ['Comprender y aplicar el concepto técnico de la lección.'];

  const aiNotes =
    lesson?.aiNotes ||
    lesson?.aiContext ||
    lesson?.subtitle ||
    lesson?.playground?.badQueryLabel ||
    'Verificar siempre el grano de cada tabla antes de agregar o hacer JOIN.';

  return {
    lessonId: lesson?.id || lessonId || 'general',
    contentVersion: Number(lesson?.contentVersion) || 1,
    level: resolvedLevel,
    trackName,
    lessonTitle: lesson?.title || parentModule?.title || 'Fundamentos de datos en Grano',
    sectionId: activeSection?.id || String(sectionId ?? '0'),
    sectionHeading: activeSection?.heading || lesson?.title || 'Concepto principal',
    sectionBody: activeSection?.body || lesson?.storyContext || lesson?.hook || '',
    objectives: objectivesList.join(' · '),
    aiNotes,
    schemaSummary: MERCADO_BRISA_SCHEMA_SUMMARY,
  };
}

/**
 * Formatea y resume el campo `result` (máximo 50 filas si es un array).
 */
export function formatResultSummary(result) {
  if (result === undefined || result === null || result === '') {
    return '';
  }
  if (typeof result === 'string') {
    return cleanControlChars(result).slice(0, 4000);
  }
  if (Array.isArray(result)) {
    const sliced = result.slice(0, MAX_RESULT_ROWS);
    try {
      return JSON.stringify(sliced).slice(0, 4000);
    } catch {
      return String(sliced).slice(0, 4000);
    }
  }
  if (typeof result === 'object') {
    try {
      if (Array.isArray(result.rows)) {
        const copy = { ...result, rows: result.rows.slice(0, MAX_RESULT_ROWS) };
        return JSON.stringify(copy).slice(0, 4000);
      }
      return JSON.stringify(result).slice(0, 4000);
    } catch {
      return '';
    }
  }
  return String(result).slice(0, 4000);
}

const promptTemplateCache = new Map();

/**
 * Carga la plantilla `.md` del modo indicado desde `server/ai/prompts/`.
 */
export function loadPromptTemplate(mode = 'tutor') {
  const modeToFile = {
    tutor: 'tutor.md',
    'explain-section': 'explain-section.md',
    'explain-error': 'explain-error.md',
    'review-sql': 'review-sql.md',
    feynman: 'feynman.md',
    'quiz-more': 'quiz-more.md',
    interview: 'interview.md',
    'interview-grade': 'interview.md',
    glossary: 'explain-section.md',
  };

  const fileName = modeToFile[mode] || 'tutor.md';
  if (promptTemplateCache.has(fileName)) {
    return promptTemplateCache.get(fileName);
  }

  const fullPath = path.join(PROMPTS_DIR, fileName);
  const content = fs.readFileSync(fullPath, 'utf8');
  promptTemplateCache.set(fileName, content);
  return content;
}

/**
 * Renderiza una plantilla de prompt evaluando expresiones condicionales `{campo ? 'Prefijo: ' + campo}`
 * y variables simples `{campo}`.
 */
export function renderPromptTemplate(template, vars) {
  let rendered = template.replace(
    /\{([a-zA-Z0-9_]+)\s*\?\s*'([^']*)'\s*\+\s*\1\}/g,
    (_, varName, prefix) => {
      const val = vars[varName];
      if (val && String(val).trim().length > 0) {
        return `${prefix}${String(val).trim()}`;
      }
      return '';
    }
  );

  rendered = rendered.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
    if (Object.hasOwn(vars, varName)) {
      return String(vars[varName] ?? '');
    }
    return match;
  });

  // Limpiar líneas vacías triples generadas por condicionales vacíos
  return rendered.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Formatea una lista de mensajes `{ role, content }` como bloque de historial.
 */
function formatHistoryLines(historyMessages) {
  if (!Array.isArray(historyMessages) || historyMessages.length === 0) {
    return '(inicio de la conversación)';
  }
  return historyMessages
    .map((m) => {
      const speaker = m.role === 'assistant' ? 'Tutor' : 'Persona';
      return `${speaker}: ${cleanControlChars(m.content).slice(0, MAX_MESSAGE_CHARS)}`;
    })
    .join('\n');
}

/**
 * Construye el prompt completo desde el contexto del servidor garantizando el límite estricto
 * de `MAX_TOTAL_PROMPT_CHARS` (24 000 caracteres) y recortando primero el historial más antiguo.
 */
export async function buildContextPrompt({
  mode = 'tutor',
  lessonId,
  moduleTitle,
  sectionId,
  messages = [],
  question: explicitQuestion,
  selection,
  code,
  result,
  simulatorState,
  track,
  level,
  customLesson,
  maxTotalChars = MAX_TOTAL_PROMPT_CHARS,
} = {}) {
  const ctx = await resolveLessonContext({
    lessonId,
    moduleTitle,
    sectionId,
    track,
    level,
    customLesson,
  });

  const normalizedMessages = Array.isArray(messages)
    ? messages
        .filter((m) => m && typeof m.content === 'string' && cleanControlChars(m.content).length > 0)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: cleanControlChars(m.content).slice(0, MAX_MESSAGE_CHARS),
        }))
    : [];

  let question = cleanControlChars(explicitQuestion || '').slice(0, MAX_MESSAGE_CHARS);
  let historyMessages = [...normalizedMessages];

  if (!question && historyMessages.length > 0) {
    const last = historyMessages[historyMessages.length - 1];
    if (last.role === 'user') {
      question = last.content;
      historyMessages = historyMessages.slice(0, -1);
    }
  }
  if (!question) {
    question = 'Explícame esta sección con un ejemplo claro.';
  }

  const cleanedSelection = cleanControlChars(selection || '').slice(0, MAX_SELECTION_CHARS);
  const cleanedCode = cleanControlChars(code || '').slice(0, MAX_CODE_CHARS);
  let cleanedResult = formatResultSummary(result);
  if (simulatorState && typeof simulatorState === 'object') {
    const simStr = JSON.stringify(simulatorState).slice(0, 1500);
    cleanedResult = cleanedResult
      ? `${cleanedResult}\nEstado del simulador: ${simStr}`
      : `Estado del simulador: ${simStr}`;
  }

  const template = loadPromptTemplate(mode);

  const assemble = (histSlice, bodyText = ctx.sectionBody, codeText = cleanedCode, resText = cleanedResult) =>
    renderPromptTemplate(template, {
      level: ctx.level,
      trackName: ctx.trackName,
      lessonTitle: ctx.lessonTitle,
      sectionHeading: ctx.sectionHeading,
      objectives: ctx.objectives,
      sectionBody: bodyText,
      aiNotes: ctx.aiNotes,
      selection: cleanedSelection,
      code: codeText,
      result: resText,
      schemaSummary: ctx.schemaSummary,
      history: formatHistoryLines(histSlice),
      question,
    });

  let prompt = assemble(historyMessages);
  let trimmedHistoryCount = 0;

  // Paso 1: si supera maxTotalChars (24 000), recortar primero los mensajes más antiguos del historial
  while (prompt.length > maxTotalChars && historyMessages.length > 0) {
    historyMessages.shift();
    trimmedHistoryCount += 1;
    prompt = assemble(historyMessages);
  }

  // Paso 2: si aún supera maxTotalChars sin historial, recortar sectionBody y result
  if (prompt.length > maxTotalChars) {
    const excess = prompt.length - maxTotalChars;
    const trimmedBody = ctx.sectionBody.slice(
      0,
      Math.max(200, ctx.sectionBody.length - excess - 200)
    );
    prompt = assemble(historyMessages, trimmedBody);
  }

  if (prompt.length > maxTotalChars) {
    prompt = prompt.slice(0, maxTotalChars);
  }

  return {
    prompt,
    context: ctx,
    trimmedHistoryCount,
    historyCount: historyMessages.length,
  };
}
