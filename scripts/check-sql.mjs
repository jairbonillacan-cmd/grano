// Ejecuta en DuckDB cada bloque SQL de las lecciones que declara `expectedOutput`
// y lo compara con lo que devuelven los Parquet de Mercado Brisa. También comprueba
// que `practice.solution` devuelva lo mismo que `practice.expected`.
//
// Uso: node scripts/check-sql.mjs [--module <moduleId>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DuckDBInstance } from '@duckdb/node-api';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const LESSONS_DIR = path.join(ROOT_DIR, 'src', 'data', 'lessons');
const DATASETS_DIR = path.join(ROOT_DIR, 'public', 'datasets');

const SQL_START = /^\s*(--[^\n]*\n\s*)*(select|with|from|explain)\b/i;
const PYTHON_IMPORT = /^\s*(#[^\n]*\n\s*)*(from\s+[\w.]+\s+import|import\s+\w)/;
const NUM_TOLERANCE = 0.011;

function parseArgs(argv) {
  const i = argv.indexOf('--module');
  return { moduleFilter: i >= 0 ? argv[i + 1] : null };
}

function normalize(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number') return Number.isNaN(v) ? null : v;
  if (v instanceof Date) v = v.toISOString();
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/.test(v)) return v.slice(0, 10);
    // Los timestamps se comparan como 'YYYY-MM-DD HH:MM:SS', igual que los escribe una lección.
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.0+)?Z?$/.test(v)) return v.replace('T', ' ').slice(0, 19);
    if (v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    return v;
  }
  if (typeof v === 'object' && typeof v.toString === 'function') return normalize(v.toString());
  return v;
}

function sameValue(a, b) {
  const x = normalize(a);
  const y = normalize(b);
  if (typeof x === 'number' && typeof y === 'number') {
    return Math.abs(x - y) <= NUM_TOLERANCE + Math.abs(y) * 1e-6;
  }
  return String(x) === String(y);
}

// Devuelve la primera diferencia legible, o null si las filas coinciden.
function firstDiff(got, expected) {
  if (got.length !== expected.length) {
    return `filas: obtiene ${got.length}, espera ${expected.length}`;
  }
  for (let r = 0; r < got.length; r += 1) {
    const gv = Object.values(got[r]);
    const ev = Object.values(expected[r]);
    if (gv.length !== ev.length) return `fila ${r + 1}: ${gv.length} columnas, espera ${ev.length}`;
    const keys = Object.keys(expected[r]);
    for (let c = 0; c < ev.length; c += 1) {
      if (!sameValue(gv[c], ev[c])) {
        return `fila ${r + 1}, ${keys[c]}: obtiene ${normalize(gv[c])}, espera ${normalize(ev[c])}`;
      }
    }
  }
  return null;
}

function collectSqlBlocks(lesson) {
  const blocks = [];
  for (const s of lesson.sections || []) {
    const ex = s.example;
    if (ex && /sql/i.test(ex.language || '') && Array.isArray(ex.expectedOutput) && ex.expectedOutput.length) {
      blocks.push({ where: `sección ${s.id}`, code: ex.code, expected: ex.expectedOutput });
    }
  }
  (lesson.workedExample?.steps || []).forEach((st, i) => {
    if (st.code && Array.isArray(st.expectedOutput) && st.expectedOutput.length) {
      blocks.push({ where: `ejemplo resuelto, paso ${i + 1}`, code: st.code, expected: st.expectedOutput });
    }
  });
  return blocks.filter((b) => SQL_START.test(b.code || '') && !PYTHON_IMPORT.test(b.code));
}

async function main() {
  const { moduleFilter } = parseArgs(process.argv.slice(2));
  const instance = await DuckDBInstance.create(':memory:');
  const con = await instance.connect();
  const dsPath = DATASETS_DIR.replace(/\\/g, '/');
  // Las lecciones leen 'orders.parquet' sin ruta, como en el laboratorio del navegador.
  await con.run(`SET file_search_path = '${dsPath}'`);
  for (const f of fs.readdirSync(DATASETS_DIR).filter((n) => n.endsWith('.parquet'))) {
    await con.run(`CREATE VIEW ${f.replace('.parquet', '')} AS SELECT * FROM read_parquet('${dsPath}/${f}')`);
  }
  const run = async (code) => (await con.runAndReadAll(code)).getRowObjectsJS();

  const modules = fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && (!moduleFilter || d.name === moduleFilter))
    .map((d) => d.name)
    .sort();

  let checked = 0;
  const failures = [];
  for (const mod of modules) {
    const dir = path.join(LESSONS_DIR, mod);
    for (const file of fs.readdirSync(dir).filter((n) => n.endsWith('.js')).sort()) {
      const rel = `src/data/lessons/${mod}/${file}`;
      const lesson = (await import(pathToFileURL(path.join(dir, file)).href)).default;
      for (const b of collectSqlBlocks(lesson)) {
        checked += 1;
        try {
          const diff = firstDiff(await run(b.code), b.expected);
          if (diff) failures.push(`${rel} · ${b.where} · ${diff}`);
        } catch (e) {
          failures.push(`${rel} · ${b.where} · error: ${String(e.message || e).split('\n')[0]}`);
        }
      }
      const p = lesson.practice;
      if (p?.type === 'sql' && p.expected && p.solution && p.solution !== p.expected) {
        checked += 1;
        try {
          const diff = firstDiff(await run(p.solution), await run(p.expected));
          if (diff) failures.push(`${rel} · práctica: solution difiere de expected · ${diff}`);
        } catch (e) {
          failures.push(`${rel} · práctica · error: ${String(e.message || e).split('\n')[0]}`);
        }
      }
    }
  }

  console.log(`check:sql · ${checked} bloques SQL ejecutados en ${modules.length} módulos.`);
  if (failures.length) {
    console.log(`\n${failures.length} bloques no coinciden con los datos reales:`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log('Resultado: OK (todo expectedOutput coincide con DuckDB).');
}

await main();
