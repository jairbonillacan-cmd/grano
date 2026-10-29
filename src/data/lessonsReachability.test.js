import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { LESSONS_V2, MODULES, getTrackPath } from './lessons/index.js';

// Toda lección escrita debe poder abrirse desde la Ruta: si el catálogo y el índice
// no se cruzan, la lección queda como "En preparación" aunque su archivo exista.
describe('Alcance de las lecciones desde la Ruta (src/data/lessons/index.js)', () => {
  const reachable = new Set(
    MODULES.flatMap((m) => m.lessons.filter((l) => l.status === 'existing').map((l) => l.v2Id))
  );

  it('1. cada lección de LESSONS_V2 aparece como existing en algún módulo', () => {
    const missing = LESSONS_V2.map((l) => l.id).filter((id) => !reachable.has(id));
    expect(missing).toEqual([]);
  });

  it('2. getTrackPath devuelve los módulos combinados con el índice, no los del catálogo crudo', () => {
    for (const track of ['de', 'da', 'bi']) {
      const fromPath = getTrackPath(track)
        .flatMap((m) => m.lessons)
        .filter((l) => l.status === 'existing');
      expect(fromPath.length).toBeGreaterThan(18);
      expect(fromPath.every((l) => typeof l.v2Id === 'string')).toBe(true);
    }
  });

  it('3. el primer módulo del tronco común tiene sus lecciones abribles', () => {
    const first = getTrackPath('bi')[0];
    expect(first.level).toBe(0);
    expect(first.lessons.some((l) => l.status === 'existing')).toBe(true);
  });

  it('4. ninguna vista importa MODULES o getTrackPath del catálogo crudo', () => {
    const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'data') walk(full);
        } else if (/\.jsx?$/.test(entry.name)) {
          const text = fs.readFileSync(full, 'utf8');
          if (/import\s*\{[^}]*\b(MODULES|getTrackPath)\b[^}]*\}\s*from\s*['"][./]*\/?data\/catalog\/modules\.js['"]/.test(text)) {
            offenders.push(path.relative(srcDir, full));
          }
        }
      }
    };
    walk(srcDir);
    expect(offenders).toEqual([]);
  });
});
