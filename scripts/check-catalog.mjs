// Valida el catálogo de la ruta: prerrequisitos existentes, sin ciclos, niveles coherentes,
// ids únicos y lecciones heredadas existentes. Imprime el resumen área × nivel.
// Uso: node scripts/check-catalog.mjs
import { MODULES, MODULES_BY_ID } from '../src/data/catalog/modules.js';
import { TRACK_IDS } from '../src/data/catalog/tracks.js';
import { LEVELS } from '../src/data/catalog/levels.js';
import { LESSONS } from '../src/data/learningPath2026.js';

const errors = [];
const legacyIds = new Set(LESSONS.map((l) => l.id));
const levelIds = new Set(LEVELS.map((l) => l.id));
const seenModules = new Set();
const seenPlanned = new Set();

for (const m of MODULES) {
  if (seenModules.has(m.id)) errors.push(`Módulo duplicado: ${m.id}`);
  seenModules.add(m.id);
  if (!TRACK_IDS.includes(m.track)) errors.push(`${m.id}: área desconocida "${m.track}"`);
  if (!levelIds.has(m.level)) errors.push(`${m.id}: nivel desconocido ${m.level}`);
  if (!m.goal || !m.project) errors.push(`${m.id}: falta goal o project`);
  if (m.lessons.length < 3 || m.lessons.length > 7) errors.push(`${m.id}: ${m.lessons.length} lecciones (se esperan 3–7)`);

  for (const p of m.prerequisites) {
    const pre = MODULES_BY_ID[p];
    if (!pre) errors.push(`${m.id}: prerrequisito inexistente "${p}"`);
    else if (pre.level > m.level) errors.push(`${m.id} (nivel ${m.level}) depende de ${p} (nivel ${pre.level})`);
  }

  for (const lesson of m.lessons) {
    if (lesson.status === 'existing') {
      if (!legacyIds.has(lesson.legacyId)) errors.push(`${m.id}: lección heredada inexistente "${lesson.legacyId}"`);
    } else {
      if (seenPlanned.has(lesson.id)) errors.push(`Lección duplicada: ${lesson.id}`);
      seenPlanned.add(lesson.id);
    }
  }
}

// Ciclos (DFS)
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

// Lecciones heredadas que no aparecen en ningún módulo
const placed = new Set(MODULES.flatMap((m) => m.lessons.filter((l) => l.legacyId).map((l) => l.legacyId)));
for (const id of legacyIds) if (!placed.has(id)) errors.push(`Lección heredada sin módulo: ${id}`);

// Resumen
const rows = [];
for (const track of TRACK_IDS) {
  for (const level of LEVELS) {
    const mods = MODULES.filter((m) => m.track === track && m.level === level.id);
    if (!mods.length) continue;
    const lessons = mods.flatMap((m) => m.lessons);
    rows.push({
      área: track,
      nivel: `${level.id} ${level.name}`,
      módulos: mods.length,
      lecciones: lessons.length,
      existentes: lessons.filter((l) => l.status === 'existing').length,
    });
  }
}
console.table(rows);
const total = MODULES.flatMap((m) => m.lessons);
console.log(`Total: ${MODULES.length} módulos, ${total.length} lecciones (${total.filter((l) => l.status === 'existing').length} existentes).`);

if (errors.length) {
  console.error(`\n${errors.length} error(es):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
