import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  validateLesson,
  validateGlossary,
  validateFlashcards,
  validateModule,
  countWords,
} from '../src/data/schema/index.js';
import { MODULES } from '../src/data/catalog/modules.js';
import { GLOSSARY_TERMS } from '../src/data/glossary.js';
import { FLASHCARDS } from '../src/data/flashcards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LESSONS_DIR = path.join(ROOT_DIR, 'src', 'data', 'lessons');

function parseArgs(argv) {
  const opts = { moduleFilter: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--module' && argv[i + 1]) {
      opts.moduleFilter = argv[i + 1].trim();
      i += 1;
    }
  }
  return opts;
}

function collectLessonFiles(dir, moduleFilter) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (moduleFilter && entry.name !== moduleFilter) continue;
      files.push(...collectLessonFiles(fullPath, null));
    } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'index.js') {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function countVisibleLessonWords(lesson) {
  const parts = [
    lesson.title,
    lesson.hook,
    ...(lesson.objectives || []),
    ...(lesson.sections || []).flatMap((s) => [s.heading, s.body]),
    lesson.workedExample?.title,
    ...(lesson.workedExample?.steps || []).map((st) => st.explanation),
    ...(lesson.checks || []).map((c) => c.prompt),
    lesson.practice?.prompt,
    lesson.roleNotes?.de,
    lesson.roleNotes?.da,
    lesson.roleNotes?.bi,
    ...(lesson.summary || []),
  ];
  return countWords(parts.filter(Boolean).join(' '));
}

async function main() {
  const { moduleFilter } = parseArgs(process.argv.slice(2));
  const lessonFiles = collectLessonFiles(LESSONS_DIR, moduleFilter);

  if (lessonFiles.length === 0) {
    console.error(
      moduleFilter
        ? `No se encontraron archivos de lección para el módulo "${moduleFilter}" en src/data/lessons/`
        : 'No se encontraron archivos de lección en src/data/lessons/'
    );
    process.exit(1);
  }

  // Conjunto de todos los IDs de lecciones conocidos (en catálogo + lecciones migradas)
  const knownLessonIds = new Set();
  for (const mod of MODULES) {
    for (const l of mod.lessons || []) {
      const lid = typeof l === 'string' ? l : l.id;
      if (lid) knownLessonIds.add(lid);
      if (typeof l === 'object' && l.legacyId) knownLessonIds.add(l.legacyId);
      if (typeof l === 'object' && l.order) {
        knownLessonIds.add(`${mod.id}-${String(l.order).padStart(2, '0')}`);
      }
    }
  }

  const loadedLessons = [];
  for (const filePath of lessonFiles) {
    const modUrl = pathToFileURL(filePath).href;
    const imported = await import(modUrl);
    const lesson = imported.default || imported.lesson;
    loadedLessons.push({ filePath, lesson });
    if (lesson?.id) knownLessonIds.add(lesson.id);
    if (lesson?.legacyId) knownLessonIds.add(lesson.legacyId);
  }

  const seenLessonIds = new Set();
  const seenGlossaryIds = new Set(GLOSSARY_TERMS.map((g) => g.id));
  const invDir = path.join(ROOT_DIR, 'docs', 'curriculo', 'investigacion');
  if (fs.existsSync(invDir)) {
    for (const f of fs.readdirSync(invDir)) {
      if (f.endsWith('-glossary.json')) {
        try {
          const extra = JSON.parse(fs.readFileSync(path.join(invDir, f), 'utf8'));
          if (Array.isArray(extra)) {
            for (const g of extra) {
              if (g && g.id) seenGlossaryIds.add(g.id);
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }
  const rows = [];
  const allErrors = [];
  const allWarnings = [];

  for (const { filePath, lesson } of loadedLessons) {
    const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const lessonErrors = [];
    const lessonWarnings = [];

    if (!lesson || typeof lesson !== 'object') {
      lessonErrors.push('El archivo no exporta un objeto de lección por defecto');
      rows.push({
        id: path.basename(filePath),
        moduleId: '-',
        level: '-',
        sections: 0,
        checks: 0,
        sources: 0,
        words: 0,
        status: 'ERROR',
        notes: lessonErrors.join('; '),
      });
      allErrors.push({ file: relPath, errors: lessonErrors });
      continue;
    }

    // 1. Unicidad de ID
    if (seenLessonIds.has(lesson.id)) {
      lessonErrors.push(`ID de lección duplicado: "${lesson.id}"`);
    }
    seenLessonIds.add(lesson.id);

    // 2. Validación de esquema Zod (Apéndice A)
    const parsed = validateLesson(lesson);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        lessonErrors.push(`${issue.path.join('.') || 'root'}: ${issue.message}`);
      }
    }

    // 3. Existencia de prerequisites
    for (const prereq of lesson.prerequisites || []) {
      if (!knownLessonIds.has(prereq)) {
        lessonErrors.push(`Prerrequisito inexistente en catálogo/lecciones: "${prereq}"`);
      }
    }

    // 4. Existencia de glossaryTerms en src/data/glossary.js
    for (const gId of lesson.glossaryTerms || []) {
      if (!seenGlossaryIds.has(gId)) {
        lessonWarnings.push(`glossaryTerm "${gId}" aún no registrado en GLOSSARY_TERMS`);
      }
    }

    // 5. Verificación explícita de feedback en todas las opciones de checks y URLs de sources
    for (const check of lesson.checks || []) {
      if (check.type === 'mcq' || check.type === 'predict-output') {
        for (const opt of check.options || []) {
          if (!opt.feedback || !String(opt.feedback).trim()) {
            lessonErrors.push(`Check "${check.id}" opción "${opt.id}" sin feedback`);
          }
        }
      }
    }

    for (const [idx, src] of (lesson.sources || []).entries()) {
      try {
        const u = new URL(src.url);
        if (u.protocol !== 'https:') {
          lessonErrors.push(`Source #${idx + 1} debe usar https:// (${src.url})`);
        }
      } catch {
        lessonErrors.push(`Source #${idx + 1} tiene URL inválida (${src.url})`);
      }
      if (!src.accessed || !/^\d{4}-\d{2}-\d{2}$/.test(src.accessed)) {
        lessonErrors.push(`Source #${idx + 1} requiere fecha accessed YYYY-MM-DD`);
      }
    }

    // 6. Rango de palabras totales visibles y bandera needsReview
    const visibleWords = countVisibleLessonWords(lesson);
    const minVisible = lesson.level === 0 ? 500 : 600;
    const maxVisible = lesson.level === 0 ? 1000 : 1600;
    if (visibleWords < minVisible || visibleWords > maxVisible) {
      lessonWarnings.push(
        `Palabras visibles (${visibleWords}) fuera del rango recomendado [${minVisible}, ${maxVisible}]`
      );
    }
    if (lesson.needsReview) {
      lessonWarnings.push('needsReview: true (pendiente de edición fina en Fase 3)');
    }

    const status = lessonErrors.length > 0 ? 'ERROR' : lessonWarnings.length > 0 ? 'OK (WARN)' : 'OK';
    rows.push({
      id: lesson.id,
      moduleId: lesson.moduleId,
      level: lesson.level,
      sections: (lesson.sections || []).length,
      checks: (lesson.checks || []).length,
      sources: (lesson.sources || []).length,
      words: visibleWords,
      status,
      notes:
        lessonErrors.length > 0
          ? lessonErrors.join(' | ')
          : lessonWarnings.join(' | '),
    });

    if (lessonErrors.length > 0) {
      allErrors.push({ file: relPath, id: lesson.id, errors: lessonErrors });
    }
    if (lessonWarnings.length > 0) {
      allWarnings.push({ file: relPath, id: lesson.id, warnings: lessonWarnings });
    }
  }

  // Validar también glosario, flashcards y módulos del catálogo si no se filtró un módulo puntual
  let glossaryOk = true;
  let flashcardsOk = true;
  let modulesOk = true;

  if (!moduleFilter) {
    const gRes = validateGlossary(GLOSSARY_TERMS);
    if (!gRes.success) {
      glossaryOk = false;
      allErrors.push({
        file: 'src/data/glossary.js',
        id: 'GLOSSARY_TERMS',
        errors: gRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const fRes = validateFlashcards(FLASHCARDS);
    if (!fRes.success) {
      flashcardsOk = false;
      allErrors.push({
        file: 'src/data/flashcards.js',
        id: 'FLASHCARDS',
        errors: fRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }

    for (const mod of MODULES) {
      const mRes = validateModule(mod);
      if (!mRes.success) {
        modulesOk = false;
        allErrors.push({
          file: 'src/data/catalog/modules.js',
          id: mod.id,
          errors: mRes.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        });
      }
    }
  }

  // Imprimir tabla de lecciones
  console.log('\n=== Validación de contenido v2 (check-content) ===');
  const header = [
    'Lección (id v2)'.padEnd(46),
    'Módulo'.padEnd(20),
    'Niv'.padEnd(4),
    'Sec'.padEnd(4),
    'Chk'.padEnd(4),
    'Src'.padEnd(4),
    'Palabras'.padEnd(9),
    'Estado'.padEnd(10),
  ].join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const r of rows) {
    console.log(
      [
        String(r.id).padEnd(46),
        String(r.moduleId).padEnd(20),
        String(r.level).padEnd(4),
        String(r.sections).padEnd(4),
        String(r.checks).padEnd(4),
        String(r.sources).padEnd(4),
        String(r.words).padEnd(9),
        String(r.status).padEnd(10),
      ].join(' | ')
    );
  }

  console.log('-'.repeat(header.length));
  console.log(
    `Resumen: ${loadedLessons.length} lecciones inspeccionadas | ${
      loadedLessons.length - allErrors.filter((e) => e.file.startsWith('src/data/lessons')).length
    } válidas | ${allWarnings.length} con advertencias (needsReview) | ${allErrors.length} con errores.`
  );
  if (!moduleFilter) {
    console.log(
      `Colecciones globales: Glosario (${GLOSSARY_TERMS.length} términos): ${
        glossaryOk ? 'OK' : 'ERROR'
      } | Flashcards (${FLASHCARDS.length} tarjetas): ${
        flashcardsOk ? 'OK' : 'ERROR'
      } | Módulos (${MODULES.length}): ${modulesOk ? 'OK' : 'ERROR'}`
    );
  }

  if (allWarnings.length > 0) {
    console.log('\nAdvertencias (no bloquean el build):');
    for (const w of allWarnings) {
      console.log(`  [WARN] ${w.id} (${w.file}): ${w.warnings.join('; ')}`);
    }
  }

  if (allErrors.length > 0) {
    console.error('\nErrores de validación encontrados:');
    for (const err of allErrors) {
      console.error(`  [ERROR] ${err.id || err.file} (${err.file}):`);
      for (const msg of err.errors) {
        console.error(`    - ${msg}`);
      }
    }
    process.exit(1);
  }

  console.log('\nResultado: OK (0 errores de esquema o integridad).');
}

main().catch((err) => {
  console.error('Fallo inesperado en check-content.mjs:', err);
  process.exit(1);
});
