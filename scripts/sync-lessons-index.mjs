import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LESSONS_DIR = path.join(ROOT_DIR, 'src', 'data', 'lessons');
const INDEX_PATH = path.join(LESSONS_DIR, 'index.js');
const MODULES_PATH = path.join(ROOT_DIR, 'src', 'data', 'catalog', 'modules.js');
const CHECK_CAT_PATH = path.join(ROOT_DIR, 'scripts', 'check-catalog.mjs');

function collectLessonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectLessonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'index.js') {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function patchCatalogHelpers() {
  let modSrc = fs.readFileSync(MODULES_PATH, 'utf8');
  if (modSrc.includes("id: plannedId,\r\n      order,") || modSrc.includes("id: plannedId,\n      order,")) {
    modSrc = modSrc.replace(
      /id:\s*plannedId,\r?\n\s*order,\r?\n\s*title:\s*entry\.title,\r?\n\s*minutes:\s*entry\.minutes\s*\|\|\s*20,\r?\n\s*status:\s*'planned',/,
      "id: entry.id || plannedId,\n      order,\n      title: entry.title,\n      minutes: entry.minutes || 20,\n      status: entry.status || 'planned',"
    );
    fs.writeFileSync(MODULES_PATH, modSrc, 'utf8');
  }

  let catSrc = fs.readFileSync(CHECK_CAT_PATH, 'utf8');
  if (catSrc.includes("import { LESSONS } from '../src/data/learningPath2026.js';")) {
    catSrc = catSrc.replace(
      "import { LESSONS } from '../src/data/learningPath2026.js';",
      "import { LESSONS, LESSONS_BY_ID } from '../src/data/lessons/index.js';"
    );
    catSrc = catSrc.replace(
      "const legacyIds = new Set(LESSONS.map((l) => l.id));",
      "const legacyIds = new Set(LESSONS.filter((l) => l.legacyId).map((l) => l.legacyId));"
    );
    catSrc = catSrc.replace(
      /if \(lesson\.status === 'existing'\) \{\r?\n\s*if \(!legacyIds\.has\(lesson\.legacyId\)\) \{\r?\n\s*errors\.push\(`\$\{m\.id\}: lección heredada inexistente "\$\{lesson\.legacyId\}"`\);\r?\n\s*\} else \{\r?\n\s*legacyCounts\.set\(lesson\.legacyId, \(legacyCounts\.get\(lesson\.legacyId\) \|\| 0\) \+ 1\);\r?\n\s*\}\r?\n\s*if \(typeof lesson\.legacyOrder !== 'number' \|\| lesson\.legacyOrder < 1 \|\| lesson\.legacyOrder > 18\) \{\r?\n\s*errors\.push\(`\$\{m\.id\} \(\$\{lesson\.id\}\): legacyOrder debe estar entre 1 y 18`\);\r?\n\s*\}\r?\n\s*\} else if \(lesson\.status !== 'planned'\) \{/,
      `if (lesson.status === 'existing') {
      if (lesson.legacyId) {
        if (!legacyIds.has(lesson.legacyId)) {
          errors.push(\`\${m.id}: lección heredada inexistente "\${lesson.legacyId}"\`);
        } else {
          legacyCounts.set(lesson.legacyId, (legacyCounts.get(lesson.legacyId) || 0) + 1);
        }
        if (typeof lesson.legacyOrder !== 'number' || lesson.legacyOrder < 1 || lesson.legacyOrder > 18) {
          errors.push(\`\${m.id} (\${lesson.id}): legacyOrder debe estar entre 1 y 18\`);
        }
      } else if (!LESSONS_BY_ID[lesson.id]) {
        errors.push(\`\${m.id} (\${lesson.id}): marcada como 'existing' pero no se encontró en src/data/lessons/index.js\`);
      }
    } else if (lesson.status !== 'planned') {`
    );
    fs.writeFileSync(CHECK_CAT_PATH, catSrc, 'utf8');
  }
}

async function main() {
  patchCatalogHelpers();

  const files = collectLessonFiles(LESSONS_DIR);
  const items = [];
  for (const filePath of files) {
    const relFromLessons = './' + path.relative(LESSONS_DIR, filePath).replace(/\\/g, '/');
    const mod = await import(pathToFileURL(filePath).href);
    const lesson = mod.default || mod.lesson;
    if (!lesson || !lesson.id) continue;
    items.push({
      relPath: relFromLessons,
      id: lesson.id,
      moduleId: lesson.moduleId,
      level: lesson.level ?? 0,
      order: lesson.order ?? 1,
      legacyOrder: lesson.legacyOrder ?? null,
    });
  }

  items.sort((a, b) => {
    if (a.legacyOrder && b.legacyOrder) return a.legacyOrder - b.legacyOrder;
    if (a.legacyOrder && !b.legacyOrder) return -1;
    if (!a.legacyOrder && b.legacyOrder) return 1;
    if (a.level !== b.level) return a.level - b.level;
    if (a.moduleId !== b.moduleId) return a.moduleId.localeCompare(b.moduleId);
    return a.order - b.order;
  });

  const importLines = items.map((item, idx) => `import lesson_${idx + 1} from '${item.relPath}';`);
  const arrayEntries = items.map((_, idx) => `  lesson_${idx + 1},`);

  const content = `import {
  MODULES as CATALOG_MODULES,
  getTrackPath as getCatalogTrackPath,
} from '../catalog/modules.js';
import { LEARNING_STAGES, ROLE_META } from '../learningPath2026.js';

${importLines.join('\n')}

export const LESSONS_V2 = [
${arrayEntries.join('\n')}
];

/**
 * Índice por ID que resuelve el id v2, el legacyId (si existe)
 * y el id corto de catálogo (<moduleId>-<01..99>).
 */
export const LESSONS_BY_ID = Object.fromEntries(
  LESSONS_V2.flatMap((lesson) => {
    const entries = [[lesson.id, lesson]];
    if (lesson.legacyId) {
      entries.push([lesson.legacyId, lesson]);
    }
    if (lesson.moduleId && typeof lesson.order === 'number') {
      const catalogKey = \`\${lesson.moduleId}-\${String(lesson.order).padStart(2, '0')}\`;
      if (catalogKey !== lesson.id) {
        entries.push([catalogKey, lesson]);
      }
    }
    return entries;
  })
);

function splitNoteIntoPoints(noteText) {
  if (!noteText || typeof noteText !== 'string') return [];
  return noteText
    .split(/(?<=\\.)\\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Adaptador de lección v2 al formato esperado por LessonPlayer y vistas,
 * preservando simultáneamente todas las propiedades del esquema v2.
 */
export function adaptLessonForLegacyPlayer(v2) {
  const interactiveSec = (v2.sections || []).find((s) => s.interactive?.component);
  const visualType = interactiveSec?.interactive?.component || null;

  const we = v2.workedExample || { steps: [] };
  const badStep = we.steps?.[0] || {};
  const goodStep = we.steps?.[1] || we.steps?.[0] || {};

  const playground = {
    title: we.title || \`Laboratorio SQL: \${v2.title}\`,
    description: we.description || badStep.explanation || '',
    badQueryLabel: badStep.label || 'Enfoque con error',
    badQuery: badStep.code || '',
    badResult: badStep.expectedOutput || [],
    goodQueryLabel: goodStep.label || 'Solución verificada',
    goodQuery: goodStep.code || '',
    goodResult: goodStep.expectedOutput || [],
    audit: we.audit || goodStep.explanation || '',
  };

  const pr = v2.practice || {};
  const codeChallenge = {
    type: pr.type || 'sql',
    title: pr.title || \`Práctica: \${v2.title}\`,
    language: pr.language || (pr.type === 'sql' ? 'sql' : 'python'),
    instruction: pr.prompt || '',
    description: pr.prompt || '',
    prompt: pr.prompt || '',
    starterCode: pr.starterCode || '',
    templateCode: pr.starterCode || '',
    template: pr.starterCode || '',
    expected: pr.expected || '',
    orderMatters: Boolean(pr.orderMatters),
    hints: pr.hints || [],
    solution: pr.solution || '',
    solutionExplanation: pr.solutionExplanation || '',
    blanks: pr.blanks || [],
    expectedOutput: pr.solutionExplanation || '',
    expectedOutputTable: pr.expectedOutputTable || [],
    rubricCriteria: pr.rubricCriteria || [],
  };

  const firstCheck = (v2.checks || [])[0] || {};
  const checkpoint = {
    question: firstCheck.prompt || '',
    options: firstCheck.options || [],
    explanation: firstCheck.explanation || '',
  };

  const rn = v2.roleNotes || {};
  const triadPerspectives = {
    DE: {
      title: 'Ingeniería de Datos (DE)',
      points: splitNoteIntoPoints(rn.de),
    },
    DA: {
      title: 'Análisis de Datos (DA)',
      points: splitNoteIntoPoints(rn.da),
    },
    BI: {
      title: 'Business Intelligence (BI)',
      points: splitNoteIntoPoints(rn.bi),
    },
  };

  const catalogKey =
    v2.moduleId && typeof v2.order === 'number'
      ? \`\${v2.moduleId}-\${String(v2.order).padStart(2, '0')}\`
      : v2.id;

  return {
    ...v2,
    id: v2.legacyId || v2.id,
    v2Id: v2.id,
    catalogId: catalogKey,
    order: v2.legacyOrder ?? v2.order,
    moduleOrder: v2.order,
    stageId: v2.stageId || \`stage-\${Math.min(6, Math.max(1, (v2.level || 0) + 1))}\`,
    subtitle: v2.subtitle || v2.title,
    goal: v2.goal || (v2.objectives || [])[0] || '',
    visualType,
    storyContext: v2.hook,
    triadPerspectives,
    playground,
    codeChallenge,
    pipelineChallenge: v2.pipelineChallenge,
    checkpoint,
    keyTakeaways: v2.summary || [],
    relatedLessons: v2.relatedLessons || [],
  };
}

export const LESSONS = LESSONS_V2.map(adaptLessonForLegacyPlayer);

export const MODULES = CATALOG_MODULES.map((mod) => ({
  ...mod,
  lessons: (mod.lessons || []).map((entry) => {
    const matched = LESSONS_BY_ID[entry.id] || (entry.legacyId && LESSONS_BY_ID[entry.legacyId]);
    if (!matched) return entry;
    return {
      ...entry,
      v2Id: matched.id,
      minutes: matched.minutes,
      status: 'existing',
    };
  }),
}));

// Las vistas leen MODULES desde aquí y no desde el catálogo: el catálogo marca
// como 'planned' toda lección que no sea legacy, aunque su archivo ya exista.
export const MODULES_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export function getTrackPath(trackId) {
  return getCatalogTrackPath(trackId).map((m) => MODULES_BY_ID[m.id] || m);
}

export function getLessonById(id) {
  return LESSONS_BY_ID[id] || null;
}

export function getSectionById(lessonId, sectionId) {
  const lesson = getLessonById(lessonId);
  if (!lesson || !Array.isArray(lesson.sections)) return null;
  return lesson.sections.find((s) => s.id === sectionId) || lesson.sections[0] || null;
}

export { LEARNING_STAGES, ROLE_META };
export default LESSONS;
`;

  fs.writeFileSync(INDEX_PATH, content, 'utf8');
  console.log(`Sincronizadas ${items.length} lecciones en src/data/lessons/index.js`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
