// Valida el catálogo de la ruta: prerrequisitos existentes, sin ciclos, niveles coherentes,
// ids únicos, verbo medible en infinitivo en goal, entregable y dataset en project,
// minutos por lección (10..35) y las 18 lecciones heredadas colocadas exactamente una vez.
// Imprime el resumen área × nivel con horas estimadas.
// Uso: node scripts/check-catalog.mjs
import { MODULES, MODULES_BY_ID } from '../src/data/catalog/modules.js';
import { TRACKS, TRACK_IDS } from '../src/data/catalog/tracks.js';
import { LEVELS } from '../src/data/catalog/levels.js';
import { LESSONS, LESSONS_BY_ID } from '../src/data/lessons/index.js';

const errors = [];
const legacyIds = new Set(LESSONS.filter((l) => l.legacyId).map((l) => l.legacyId));
const levelIds = new Set(LEVELS.map((l) => l.id));
const seenModules = new Set();
const seenLessonIds = new Set();
const legacyCounts = new Map();

const NON_VERB_AR_ER_IR = new Set([
  'cualquier',
  'primer',
  'tercer',
  'mejor',
  'peor',
  'mayor',
  'menor',
  'anterior',
  'posterior',
  'interior',
  'exterior',
  'superior',
  'inferior',
  'estándar',
  'escolar',
  'tabular',
  'columnar',
  'lineal',
  'regular',
  'singular',
  'particular',
  'similar',
  'familiar',
  'popular',
]);

const INFINITIVE_REGEX = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(ar|er|ir)$/;
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function startsWithMeasurableInfinitive(goal) {
  if (typeof goal !== 'string' || goal.trim().length === 0) return false;
  const firstWord = goal.trim().split(/[\s,.;:]+/)[0];
  if (!firstWord) return false;
  if (NON_VERB_AR_ER_IR.has(firstWord.toLowerCase())) return false;
  return INFINITIVE_REGEX.test(firstWord);
}

// 1. Validar TRACKS
for (const expectedId of ['core', 'de', 'da', 'bi']) {
  if (!TRACK_IDS.includes(expectedId)) {
    errors.push(`tracks.js: falta el área "${expectedId}"`);
  }
}
for (const t of TRACKS) {
  if (!t.name || !t.short || !t.summary) {
    errors.push(`Track ${t.id}: falta name, short o summary`);
  }
  if (!Array.isArray(t.workTasks) || t.workTasks.length < 3) {
    errors.push(`Track ${t.id}: workTasks debe tener al menos 3 tareas laborales reales`);
  }
  if (!Array.isArray(t.dayToDay) || t.dayToDay.length < 3) {
    errors.push(`Track ${t.id}: dayToDay debe tener al menos 3 elementos`);
  }
  if (!Array.isArray(t.typicalDay) || t.typicalDay.length < 3) {
    errors.push(`Track ${t.id}: typicalDay debe describir un día típico en al menos 3 líneas`);
  }
}

// 2. Validar LEVELS
for (const l of LEVELS) {
  if (l.id !== l.level) {
    errors.push(`Nivel ${l.id}: id (${l.id}) y level (${l.level}) deben coincidir`);
  }
  if (!l.name || !l.summary) {
    errors.push(`Nivel ${l.id}: falta name o summary`);
  }
  if (typeof l.outcome !== 'string' || !l.outcome.startsWith('Al terminar sabrás')) {
    errors.push(`Nivel ${l.id}: outcome debe comenzar con "Al terminar sabrás…"`);
  }
}

// 3. Validar MODULES
for (const m of MODULES) {
  if (seenModules.has(m.id)) errors.push(`Módulo duplicado: ${m.id}`);
  seenModules.add(m.id);
  if (!TRACK_IDS.includes(m.track)) errors.push(`${m.id}: área desconocida "${m.track}"`);
  if (!levelIds.has(m.level)) errors.push(`${m.id}: nivel desconocido ${m.level}`);
  if (!m.title || typeof m.title !== 'string') {
    errors.push(`${m.id}: falta title`);
  } else {
    if (m.title.includes('2026')) errors.push(`${m.id}: title no debe incluir "2026"`);
    if (EMOJI_REGEX.test(m.title)) errors.push(`${m.id}: title contiene emojis prohibidos`);
  }

  if (!m.goal || !m.project) {
    errors.push(`${m.id}: falta goal o project`);
  } else {
    if (!startsWithMeasurableInfinitive(m.goal)) {
      const firstWord = m.goal.trim().split(/\s+/)[0];
      errors.push(`${m.id}: goal debe comenzar con un verbo medible en infinitivo (-ar, -er, -ir); recibido "${firstWord}"`);
    }
    if (typeof m.project !== 'string' || m.project.trim().length < 40) {
      errors.push(`${m.id}: project debe tener al menos 40 caracteres`);
    } else {
      if (!/Mercado Brisa/i.test(m.project)) {
        errors.push(`${m.id}: project debe citar el dataset de Mercado Brisa`);
      }
      if (!/Entregable:/i.test(m.project)) {
        errors.push(`${m.id}: project debe declarar explícitamente el "Entregable:"`);
      }
    }
  }

  if (
    !m.projectSpec ||
    typeof m.projectSpec.prompt !== 'string' ||
    !m.projectSpec.prompt.trim() ||
    typeof m.projectSpec.dataset !== 'string' ||
    !m.projectSpec.dataset.trim() ||
    typeof m.projectSpec.deliverable !== 'string' ||
    !m.projectSpec.deliverable.trim()
  ) {
    errors.push(`${m.id}: projectSpec debe incluir prompt, dataset y deliverable no vacíos`);
  }

  if (m.lessons.length < 3 || m.lessons.length > 7) {
    errors.push(`${m.id}: ${m.lessons.length} lecciones (se esperan 3–7)`);
  }

  for (const p of m.prerequisites) {
    const pre = MODULES_BY_ID[p];
    if (!pre) errors.push(`${m.id}: prerrequisito inexistente "${p}"`);
    else if (pre.level > m.level) errors.push(`${m.id} (nivel ${m.level}) depende de ${p} (nivel ${pre.level})`);
  }

  m.lessons.forEach((lesson, idx) => {
    if (!lesson.id || typeof lesson.id !== 'string') {
      errors.push(`${m.id}: lección en posición ${idx + 1} sin id`);
    } else if (seenLessonIds.has(lesson.id)) {
      errors.push(`Lección duplicada: ${lesson.id}`);
    } else {
      seenLessonIds.add(lesson.id);
    }

    if (!lesson.title || typeof lesson.title !== 'string') {
      errors.push(`${m.id} (${lesson.id}): falta title`);
    } else if (EMOJI_REGEX.test(lesson.title)) {
      errors.push(`${m.id} (${lesson.id}): title contiene emojis prohibidos`);
    }

    if (lesson.order !== idx + 1) {
      errors.push(`${m.id} (${lesson.id}): order esperado ${idx + 1}, recibido ${lesson.order}`);
    }

    if (
      typeof lesson.minutes !== 'number' ||
      Number.isNaN(lesson.minutes) ||
      lesson.minutes < 10 ||
      lesson.minutes > 35
    ) {
      errors.push(`${m.id} (${lesson.id}): minutes debe ser un número entre 10 y 35 (recibido ${lesson.minutes})`);
    }

    if (lesson.status === 'existing') {
      if (lesson.legacyId) {
        if (!legacyIds.has(lesson.legacyId)) {
          errors.push(`${m.id}: lección heredada inexistente "${lesson.legacyId}"`);
        } else {
          legacyCounts.set(lesson.legacyId, (legacyCounts.get(lesson.legacyId) || 0) + 1);
        }
        if (typeof lesson.legacyOrder !== 'number' || lesson.legacyOrder < 1 || lesson.legacyOrder > 18) {
          errors.push(`${m.id} (${lesson.id}): legacyOrder debe estar entre 1 y 18`);
        }
      } else if (!LESSONS_BY_ID[lesson.id]) {
        errors.push(`${m.id} (${lesson.id}): marcada como 'existing' pero no se encontró en src/data/lessons/index.js`);
      }
    } else if (lesson.status !== 'planned') {
      errors.push(`${m.id} (${lesson.id}): status desconocido "${lesson.status}"`);
    }
  });
}

// 4. Ciclos (DFS)
const state = {};
function visit(id, trail) {
  if (state[id] === 'done') return;
  if (state[id] === 'active') {
    errors.push(`Ciclo de prerrequisitos: ${[...trail, id].join(' → ')}`);
    return;
  }
  state[id] = 'active';
  for (const p of MODULES_BY_ID[id]?.prerequisites || []) visit(p, [...trail, id]);
  state[id] = 'done';
}
MODULES.forEach((m) => visit(m.id, []));

// 5. Lecciones heredadas que no aparecen en ningún módulo o que aparecen duplicadas
for (const id of legacyIds) {
  const count = legacyCounts.get(id) || 0;
  if (count === 0) errors.push(`Lección heredada sin módulo: ${id}`);
  else if (count > 1) errors.push(`Lección heredada duplicada (${count} veces): ${id}`);
}

// 6. Resumen área × nivel
const rows = [];
for (const track of TRACK_IDS) {
  for (const level of LEVELS) {
    const mods = MODULES.filter((m) => m.track === track && m.level === level.id);
    if (!mods.length) continue;
    const lessons = mods.flatMap((m) => m.lessons);
    const minutes = lessons.reduce((acc, l) => acc + (l.minutes || 0), 0);
    rows.push({
      área: track,
      nivel: `${level.id} ${level.name}`,
      módulos: mods.length,
      lecciones: lessons.length,
      existentes: lessons.filter((l) => l.status === 'existing').length,
      minutos: minutes,
      horas: Number((minutes / 60).toFixed(1)),
    });
  }
}
console.table(rows);
const total = MODULES.flatMap((m) => m.lessons);
const totalMinutes = total.reduce((acc, l) => acc + (l.minutes || 0), 0);
const totalHours = (totalMinutes / 60).toFixed(1);
console.log(
  `Total: ${MODULES.length} módulos, ${total.length} lecciones (${total.filter((l) => l.status === 'existing').length} existentes, ${total.filter((l) => l.status === 'planned').length} planificadas), ${totalMinutes} min (${totalHours} h estimadas).`
);

if (errors.length) {
  console.error(`\n${errors.length} error(es):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
