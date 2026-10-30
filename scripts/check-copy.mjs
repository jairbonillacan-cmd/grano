import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    customPaths: [],
    reportOnly: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--path' && argv[i + 1]) {
      opts.customPaths.push(argv[i + 1]);
      i += 1;
    } else if (arg === '--report-only') {
      opts.reportOnly = true;
    }
  }
  return opts;
}

function collectTargetFiles(baseDir, filterFn) {
  if (!fs.existsSync(baseDir)) return [];
  const stat = fs.statSync(baseDir);
  if (stat.isFile()) return filterFn(baseDir) ? [baseDir] : [];
  const out = [];
  for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
    const full = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTargetFiles(full, filterFn));
    } else if (entry.isFile() && filterFn(full)) {
      out.push(full);
    }
  }
  return out.sort();
}

function wordBoundaryRegex(patternSource) {
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${patternSource})(?![\\p{L}\\p{N}_])`, 'giu');
}

// Reglas
const PROHIBITED_RULES = [
  {
    id: 'clave (adjetivo)',
    regex: wordBoundaryRegex(
      '(?:conceptos?|aspectos?|ideas?|piezas?|puntos?|factores?|elementos?|roles?|preguntas?|hallazgos?|decisiones?|pilares?|reglas?|pasos?)\\s+claves?|claves?\\s+para\\s+'
    ),
  },
  { id: 'crucial', regex: wordBoundaryRegex('crucial(?:es)?') },
  { id: 'fundamental', regex: wordBoundaryRegex('fundamental(?:es)?') },
  { id: 'potente', regex: wordBoundaryRegex('potentes?') },
  { id: 'poderoso', regex: wordBoundaryRegex('poderos[oa]s?') },
  { id: 'robusto', regex: wordBoundaryRegex('robust[oa]s?') },
  { id: 'innegociable', regex: wordBoundaryRegex('innegociables?') },
  { id: 'de nivel producción', regex: wordBoundaryRegex('(?:de\\s+)?nivel\\s+producci[oó]n') },
  { id: 'de clase mundial', regex: wordBoundaryRegex('de\\s+clase\\s+mundial') },
  { id: 'de vanguardia', regex: wordBoundaryRegex('de\\s+vanguardia') },
  { id: 'revolucionario / revoluciona', regex: wordBoundaryRegex('revolucionari[oa]s?|revolucionan?') },
  { id: 'transformador', regex: wordBoundaryRegex('transformador(?:a|es|as)?') },
  { id: 'desbloquea / desbloquear', regex: wordBoundaryRegex('desbloque(?:a|ar|an|ando|ado)') },
  { id: 'sin fricción', regex: wordBoundaryRegex('sin\\s+fricci[oó]n') },
  { id: 'sin esfuerzo', regex: wordBoundaryRegex('sin\\s+esfuerzo') },
  { id: 'ecosistema', regex: wordBoundaryRegex('ecosistemas?') },
  { id: 'holístico', regex: wordBoundaryRegex('hol[ií]stic[oa]s?') },
  { id: 'sinergia', regex: wordBoundaryRegex('sinergias?') },
  { id: 'empoderar', regex: wordBoundaryRegex('empoder(?:a|ar|an|ando|ado)') },
  {
    id: 'potenciar',
    regex: wordBoundaryRegex('potenci(?:ar|ando|ado|an)(?!\\s+estad[ií]stica)'),
  },
  { id: 'dominar / domina', regex: wordBoundaryRegex('domin(?:a|ar|as|an|ando|ado)') },
  { id: 'viaje / travesía', regex: wordBoundaryRegex('viajes?|traves[ií]as?') },
  { id: 'aventura', regex: wordBoundaryRegex('aventuras?') },
  { id: 'superpoder', regex: wordBoundaryRegex('superpoder(?:es)?') },
  { id: 'mágico', regex: wordBoundaryRegex('m[aá]gic[oa]s?') },
  { id: 'sumérgete', regex: wordBoundaryRegex('sum[eé]rgete|sumergirse') },
  { id: 'descubre', regex: wordBoundaryRegex('descubr(?:e|ir|iendo)') },
  { id: 'en este mundo', regex: wordBoundaryRegex('en\\s+este\\s+mundo') },
  { id: 'hoy en día', regex: wordBoundaryRegex('hoy\\s+en\\s+d[ií]a') },
  { id: 'en la era de', regex: wordBoundaryRegex('en\\s+la\\s+era\\s+de') },
  { id: 'cabe destacar', regex: wordBoundaryRegex('cabe\\s+destacar') },
  { id: 'es importante destacar', regex: wordBoundaryRegex('es\\s+importante\\s+destacar') },
  { id: 'en resumen,', regex: wordBoundaryRegex('en\\s+resumen\\s*,') },
  { id: 'Tríada', regex: wordBoundaryRegex('tr[ií]adas?') },
  { id: 'Atelier', regex: wordBoundaryRegex('atelier') },
  { id: 'Frontera 2026', regex: wordBoundaryRegex('frontera\\s+2026') },
  { id: 'Cero slop / Cero relleno', regex: wordBoundaryRegex('cero\\s+(?:slop|relleno)') },
  { id: 'Caso real', regex: wordBoundaryRegex('casos?\\s+real(?:es)?') },
];

// Pictografías/emojis reales, excluyendo caracteres tipográficos o flechas técnicas
const ALLOWED_TECH_SYMBOLS = new Set([
  '✓', '✔', '✕', '✖', '×', '→', '←', '↑', '↓', '↔', '⇒', '▸', '▾', '▴', '▸',
  '•', '·', '—', '–', '…', '≤', '≥', '≠', '±', '∞', '∑', '∏', 'Δ', 'λ', 'μ', 'σ', 'θ', 'χ',
  '①', '②', '③', '④', '⑤', '⚠', '⚡',
]);
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

function findEmojisInLine(line) {
  const hits = [];
  for (const match of line.matchAll(EMOJI_REGEX)) {
    const ch = match[0];
    if (!ALLOWED_TECH_SYMBOLS.has(ch)) {
      hits.push(ch);
    }
  }
  return hits;
}

function isCommentLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

function isSourceOrImportLine(trimmed) {
  return (
    trimmed.includes('"accessed"') ||
    trimmed.includes('accessed:') ||
    trimmed.includes('"url"') ||
    trimmed.includes('url:') ||
    trimmed.includes('"title"') ||
    trimmed.includes('https://') ||
    trimmed.startsWith('import ') ||
    /^export\s+\{[^}]*\}\s+from\s+/.test(trimmed) ||
    trimmed.includes('GLOSSARY_CONCEPTS_2026') ||
    trimmed.includes('learningPath2026') ||
    trimmed.includes('curriculum2026') ||
    trimmed.includes('ruta_datos_2026') ||
    trimmed.includes('tool2026') ||
    trimmed.includes('2026-') // Fechas ISO tipo 2026-10-29 o timestamps de ejemplos SQL
  );
}

function scanFile(filePath) {
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const isJsx = filePath.endsWith('.jsx');
  const findings = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (!trimmed || isCommentLine(trimmed)) return;

    // 1. Términos prohibidos
    for (const rule of PROHIBITED_RULES) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        findings.push({
          file: relPath,
          line: lineNum,
          term: rule.id,
          match: match[0],
        });
      }
    }

    // 2. Signo '¡' en archivos de interfaz (.jsx)
    if (isJsx && line.includes('¡')) {
      findings.push({
        file: relPath,
        line: lineNum,
        term: '¡ (exclamación en interfaz)',
        match: '¡',
      });
    }

    // 3. Emojis Unicode
    const emojis = findEmojisInLine(line);
    for (const em of emojis) {
      findings.push({
        file: relPath,
        line: lineNum,
        term: 'emoji',
        match: em,
      });
    }

    // 4. "2026" fuera de sources/accessed/fechas ISO/identificadores legacy
    if (line.includes('2026') && !isSourceOrImportLine(trimmed)) {
      const yearRegex = /(?<![\p{L}\p{N}_-])2026(?![\p{L}\p{N}_-])/gu;
      let ym;
      while ((ym = yearRegex.exec(line)) !== null) {
        findings.push({
          file: relPath,
          line: lineNum,
          term: '2026 (fuera de sources/accessed)',
          match: ym[0],
        });
      }
    }

    // 5. Exceso de negritas (> 3 ocurrencias de **...** en un mismo párrafo/línea)
    const paragraphs = line.split(/\\n\\n|\n\n/);
    for (const para of paragraphs) {
      const boldMatches = [...para.matchAll(/\*\*[^*]+\*\*/g)];
      if (boldMatches.length > 3) {
        findings.push({
          file: relPath,
          line: lineNum,
          term: 'negritas excesivas (>3 ** por párrafo)',
          match: `${boldMatches.length} negritas`,
        });
      }
    }
  });

  return findings;
}

async function computeSectionSentenceStats(lessonFiles) {
  let totalSentences = 0;
  let totalWords = 0;
  const perLessonOver22 = [];

  for (const filePath of lessonFiles) {
    try {
      const imported = await import(pathToFileURL(filePath).href);
      const lesson = imported.default;
      if (!lesson || !Array.isArray(lesson.sections)) continue;

      let lSentences = 0;
      let lWords = 0;
      for (const sec of lesson.sections) {
        const cleanBody = String(sec.body || '')
          .replace(/`[^`]*`/g, ' codigo ')
          .replace(/\*\*([^*]+)\*\*/g, '$1');
        const sentences = cleanBody
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const s of sentences) {
          const w = s.split(/\s+/).filter(Boolean).length;
          if (w > 0) {
            lSentences += 1;
            lWords += w;
          }
        }
      }

      totalSentences += lSentences;
      totalWords += lWords;
      const avg = lSentences > 0 ? lWords / lSentences : 0;
      if (avg > 22) {
        perLessonOver22.push({
          id: lesson.id,
          file: path.relative(ROOT_DIR, filePath).replace(/\\/g, '/'),
          avg: Number(avg.toFixed(1)),
        });
      }
    } catch {
      // Ignorar archivos que no sean módulos ES de lección
    }
  }

  const globalAvg = totalSentences > 0 ? Number((totalWords / totalSentences).toFixed(1)) : 0;
  return { totalSentences, totalWords, globalAvg, perLessonOver22 };
}

async function main() {
  const { customPaths, reportOnly } = parseArgs(process.argv.slice(2));

  let targetFiles = [];
  if (customPaths.length > 0) {
    for (const p of customPaths) {
      const resolved = path.resolve(ROOT_DIR, p);
      targetFiles.push(
        ...collectTargetFiles(
          resolved,
          (f) => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.mjs')
        )
      );
    }
  } else {
    const dataFiles = collectTargetFiles(
      path.join(ROOT_DIR, 'src', 'data'),
      (f) =>
        (f.endsWith('.js') || f.endsWith('.mjs')) &&
        !f.replace(/\\/g, '/').includes('/src/data/schema/')
    );
    const jsxFiles = collectTargetFiles(path.join(ROOT_DIR, 'src'), (f) => f.endsWith('.jsx'));
    targetFiles = [...new Set([...dataFiles, ...jsxFiles])].sort();
  }

  const allFindings = [];
  for (const file of targetFiles) {
    allFindings.push(...scanFile(file));
  }

  // Estadísticas de longitud de frase en lecciones v2
  const lessonFiles = collectTargetFiles(
    path.join(ROOT_DIR, 'src', 'data', 'lessons'),
    (f) => f.endsWith('.js') && !f.endsWith('index.js')
  );
  const sentenceStats = await computeSectionSentenceStats(lessonFiles);

  console.log('\n=== Auditoría anti-slop de copy (check-copy) ===');
  console.log(`Archivos escaneados: ${targetFiles.length}`);

  if (allFindings.length > 0) {
    console.log('\nHallazgos detallados (archivo:línea — término [coincidencia]):');
    for (const f of allFindings) {
      console.log(`  ${f.file}:${f.line} — ${f.term} ["${f.match}"]`);
    }

    const byTerm = {};
    const byFile = {};
    for (const f of allFindings) {
      byTerm[f.term] = (byTerm[f.term] || 0) + 1;
      byFile[f.file] = (byFile[f.file] || 0) + 1;
    }

    console.log('\n--- Conteo por término prohibido / regla ---');
    for (const [term, count] of Object.entries(byTerm).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${term.padEnd(38)} : ${count}`);
    }

    console.log('\n--- Conteo por archivo ---');
    for (const [file, count] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${file.padEnd(65)} : ${count}`);
    }
  } else {
    console.log('\n0 hallazgos de términos prohibidos, emojis, "2026" o exceso de negritas.');
  }

  console.log('\n--- Longitud media de frase en sections[].body ---');
  console.log(
    `Media global: ${sentenceStats.globalAvg} palabras/frase (${sentenceStats.totalWords} palabras en ${sentenceStats.totalSentences} frases; límite <= 22).`
  );
  if (sentenceStats.perLessonOver22.length > 0) {
    console.log('Lecciones que superan 22 palabras/frase de media:');
    for (const item of sentenceStats.perLessonOver22) {
      console.log(`  - ${item.id} (${item.file}): ${item.avg} palabras/frase`);
    }
  }

  console.log(`\nTotal de hallazgos: ${allFindings.length}`);

  if (allFindings.length > 0 && !reportOnly) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fallo inesperado en check-copy.mjs:', err);
  process.exit(1);
});
