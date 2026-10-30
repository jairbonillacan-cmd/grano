import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  LESSONS,
  LESSONS_V2,
  LESSONS_BY_ID,
  MODULES,
  MODULES_BY_ID,
  getTrackPath,
} from '../../src/data/lessons/index.js';
import {
  GLOSSARY_TERMS,
  GLOSSARY_BY_ID,
} from '../../src/data/glossary.js';
import {
  FLASHCARDS,
  FLASHCARDS_BY_ID,
} from '../../src/data/flashcards.js';
import {
  validateGranoState,
  importState,
  exportState,
  getState,
  resetAllProgress,
} from '../../src/state/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/progress.json');

describe('Integridad del currículo y coherencia cruzada (MODULES, LESSONS, GLOSSARY, FLASHCARDS, progress.json)', () => {
  it('1. MODULES contiene los 32 módulos con IDs únicos, niveles 0..4, pistas válidas y lecciones abribles', () => {
    expect(MODULES.length).toBe(32);
    const seenModuleIds = new Set();
    const validTracks = new Set(['core', 'de', 'da', 'bi']);

    for (const mod of MODULES) {
      expect(typeof mod.id).toBe('string');
      expect(mod.id.length).toBeGreaterThan(2);
      expect(seenModuleIds.has(mod.id)).toBe(false);
      seenModuleIds.add(mod.id);

      expect([0, 1, 2, 3, 4]).toContain(mod.level);
      expect(validTracks.has(mod.track)).toBe(true);
      expect(typeof mod.title).toBe('string');
      expect(mod.title.trim().length).toBeGreaterThan(3);
      expect(typeof mod.project).toBe('string');
      expect(mod.project.trim().length).toBeGreaterThan(3);
      expect(Array.isArray(mod.lessons)).toBe(true);
      expect(mod.lessons.length).toBeGreaterThan(0);

      for (const lessonRef of mod.lessons) {
        expect(lessonRef.status).toBe('existing');
        const resolved =
          LESSONS_BY_ID[lessonRef.v2Id] ||
          LESSONS_BY_ID[lessonRef.id] ||
          (lessonRef.legacyId ? LESSONS_BY_ID[lessonRef.legacyId] : null);
        expect(resolved, `Lección huérfana en módulo ${mod.id}: ${lessonRef.id}`).toBeTruthy();
      }
    }
  });

  it('2. LESSONS_V2 contiene las 154 lecciones con estructura completa (secciones, checks, práctica y fuentes)', () => {
    expect(LESSONS_V2.length).toBe(154);
    expect(LESSONS.length).toBe(154);
    const seenLessonIds = new Set();

    for (const lesson of LESSONS_V2) {
      expect(typeof lesson.id).toBe('string');
      expect(seenLessonIds.has(lesson.id)).toBe(false);
      seenLessonIds.add(lesson.id);

      expect(MODULES_BY_ID[lesson.moduleId], `Módulo inexistente ${lesson.moduleId} en ${lesson.id}`).toBeTruthy();
      expect([0, 1, 2, 3, 4]).toContain(lesson.level);
      expect(Array.isArray(lesson.tracks)).toBe(true);
      expect(lesson.tracks.length).toBeGreaterThan(0);
      expect(typeof lesson.minutes).toBe('number');
      expect(lesson.minutes).toBeGreaterThanOrEqual(5);

      expect(Array.isArray(lesson.objectives)).toBe(true);
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(2);

      expect(Array.isArray(lesson.sections)).toBe(true);
      expect(lesson.sections.length).toBeGreaterThanOrEqual(2);
      const secIds = new Set();
      for (const sec of lesson.sections) {
        expect(typeof sec.id).toBe('string');
        expect(secIds.has(sec.id)).toBe(false);
        secIds.add(sec.id);
        const secTitle = sec.title || sec.heading;
        expect(typeof secTitle, `Falta title/heading en sección ${sec.id} de ${lesson.id}`).toBe('string');
        expect(secTitle.trim().length).toBeGreaterThan(2);
        const body = sec.content || sec.body || '';
        expect(body.trim().length, `Sección vacía ${sec.id} en ${lesson.id}`).toBeGreaterThan(40);
      }

      expect(Array.isArray(lesson.checks)).toBe(true);
      expect(lesson.checks.length).toBeGreaterThanOrEqual(3);
      expect(lesson.checks.length).toBeLessThanOrEqual(6);
      for (const chk of lesson.checks) {
        expect(typeof chk.id).toBe('string');
        expect(typeof chk.prompt).toBe('string');
        expect(chk.prompt.trim().length).toBeGreaterThan(10);
        if (Array.isArray(chk.options)) {
          expect(chk.options.length).toBeGreaterThanOrEqual(2);
          expect(chk.options.some((o) => o.correct === true)).toBe(true);
        } else if (chk.type === 'fill-code') {
          expect(Array.isArray(chk.blanks)).toBe(true);
          expect(chk.blanks.length).toBeGreaterThan(0);
        } else if (chk.type === 'order') {
          expect(Array.isArray(chk.items)).toBe(true);
          expect(chk.items.length).toBeGreaterThanOrEqual(2);
        }
      }

      expect(lesson.practice, `Falta práctica en ${lesson.id}`).toBeTruthy();
      expect(['sql', 'fill-blanks']).toContain(lesson.practice.type);
      expect(typeof lesson.practice.prompt).toBe('string');
      expect(typeof lesson.practice.solution).toBe('string');

      expect(Array.isArray(lesson.sources)).toBe(true);
      expect(lesson.sources.length).toBeGreaterThanOrEqual(3);
      for (const src of lesson.sources) {
        expect(typeof src.title).toBe('string');
        expect(src.url).toMatch(/^https?:\/\//);
      }
    }
  });

  it('3. getTrackPath ordena primero el tronco común (core) en niveles 0 y 1 antes de la especialidad elegida', () => {
    for (const track of ['de', 'da', 'bi']) {
      const pathMods = getTrackPath(track);
      expect(pathMods.length).toBeGreaterThan(10);
      const level0And1 = pathMods.filter((m) => m.level <= 1);
      expect(level0And1.length).toBeGreaterThan(0);
      expect(level0And1.every((m) => m.track === 'core')).toBe(true);
      const specMods = pathMods.filter((m) => m.track === track);
      expect(specMods.length).toBeGreaterThan(0);
      expect(specMods.every((m) => m.level >= 2)).toBe(true);
    }
  });

  it('4. GLOSSARY_TERMS tiene IDs únicos y todas sus referencias a lecciones y términos existen', () => {
    expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(300);
    const seenIds = new Set();

    for (const term of GLOSSARY_TERMS) {
      expect(typeof term.id).toBe('string');
      expect(seenIds.has(term.id)).toBe(false);
      seenIds.add(term.id);

      expect(typeof term.term).toBe('string');
      expect(term.term.trim().length).toBeGreaterThan(1);
      expect(typeof term.definition).toBe('string');
      expect(term.definition.trim().length).toBeGreaterThan(10);
      expect(['core', 'de', 'da', 'bi']).toContain(term.track);

      for (const relLessonId of term.relatedLessons || []) {
        expect(
          LESSONS_BY_ID[relLessonId],
          `Término ${term.id} referencia lección inexistente: ${relLessonId}`
        ).toBeTruthy();
      }

      for (const relTermId of term.relatedTerms || []) {
        expect(relTermId).not.toBe(term.id);
        expect(
          GLOSSARY_BY_ID[relTermId],
          `Término ${term.id} referencia término inexistente: ${relTermId}`
        ).toBeTruthy();
      }
    }
  });

  it('5. FLASHCARDS tiene IDs únicos y todas sus referencias a lessonId y moduleId existen en el catálogo', () => {
    expect(FLASHCARDS.length).toBeGreaterThanOrEqual(75);
    const seenCardIds = new Set();

    for (const card of FLASHCARDS) {
      expect(typeof card.id).toBe('string');
      expect(seenCardIds.has(card.id)).toBe(false);
      seenCardIds.add(card.id);

      expect(typeof card.front).toBe('string');
      expect(card.front.trim().length).toBeGreaterThan(5);
      expect(typeof card.back).toBe('string');
      expect(card.back.trim().length).toBeGreaterThan(5);

      expect(
        LESSONS_BY_ID[card.lessonId],
        `Flashcard ${card.id} apunta a lessonId inexistente: ${card.lessonId}`
      ).toBeTruthy();
      expect(
        MODULES_BY_ID[card.moduleId],
        `Flashcard ${card.id} apunta a moduleId inexistente: ${card.moduleId}`
      ).toBeTruthy();
    }
  });

  it('6. tests/fixtures/progress.json cumple GranoStateSchema y todas sus claves cruzan con LESSONS, MODULES y FLASHCARDS', () => {
    expect(fs.existsSync(FIXTURE_PATH)).toBe(true);
    const rawJson = fs.readFileSync(FIXTURE_PATH, 'utf8');
    const fixture = JSON.parse(rawJson);

    const parsed = validateGranoState(fixture);
    expect(parsed.success).toBe(true);
    expect(fixture.version).toBe(1);
    expect(fixture.profile.track).toBe('bi');
    expect(fixture.profile.onboarded).toBe(true);

    const lessonIds = Object.keys(fixture.progress.lessons);
    expect(lessonIds.length).toBeGreaterThanOrEqual(8);
    for (const lid of lessonIds) {
      const lessonObj = LESSONS_BY_ID[lid];
      expect(lessonObj, `Lección en fixture no existe en LESSONS_BY_ID: ${lid}`).toBeTruthy();
      const entry = fixture.progress.lessons[lid];
      if (entry.sectionId) {
        const secExists = lessonObj.sections.some((s) => s.id === entry.sectionId);
        expect(secExists, `Sección ${entry.sectionId} no existe en ${lid}`).toBe(true);
      }
      for (const chkId of Object.keys(entry.checks || {})) {
        const chkExists = lessonObj.checks.some((c) => c.id === chkId);
        expect(chkExists, `Check ${chkId} no existe en ${lid}`).toBe(true);
      }
    }

    const projectIds = Object.keys(fixture.progress.projects);
    expect(projectIds.length).toBeGreaterThanOrEqual(2);
    for (const pid of projectIds) {
      const modId = pid.replace(/^project-/, '');
      expect(MODULES_BY_ID[modId], `Proyecto ${pid} no corresponde a módulo válido`).toBeTruthy();
    }

    const cardIds = Object.keys(fixture.review.cards);
    expect(cardIds.length).toBeGreaterThanOrEqual(3);
    for (const cid of cardIds) {
      expect(FLASHCARDS_BY_ID[cid], `Tarjeta FSRS ${cid} no existe en FLASHCARDS`).toBeTruthy();
    }

    for (const threadLessonId of Object.keys(fixture.tutor.threads)) {
      expect(LESSONS_BY_ID[threadLessonId]).toBeTruthy();
    }
  });

  it('7. importState y exportState preservan intacto tests/fixtures/progress.json tras reinicio completo', () => {
    const rawJson = fs.readFileSync(FIXTURE_PATH, 'utf8');
    resetAllProgress(new Date('2026-10-30T10:00:00.000Z'));
    expect(Object.keys(getState().progress.lessons).length).toBe(0);

    const importRes = importState(rawJson);
    expect(importRes.ok).toBe(true);

    const current = getState();
    expect(current.profile.track).toBe('bi');
    expect(Object.keys(current.progress.lessons).length).toBe(9);
    expect(Object.keys(current.progress.projects).length).toBe(2);
    expect(Object.keys(current.review.cards).length).toBe(3);

    const exported = exportState({ date: new Date('2026-10-30T10:00:00.000Z'), download: false });
    expect(exported.ok).toBe(true);
    expect(validateGranoState(exported.state).success).toBe(true);
    expect(exported.state.progress.lessons['c1-sql-joins-02-grano-fanout'].status).toBe('completed');
  });

  it('8. pruebas adversariales sobre validateGranoState e importState (versiones futuras, escalas fuera de rango, hilos > 30, minutos negativos)', () => {
    const rawJson = fs.readFileSync(FIXTURE_PATH, 'utf8');
    const base = JSON.parse(rawJson);

    // 1. Versión incompatible
    const v2 = structuredClone(base);
    v2.version = 2;
    expect(importState(v2).ok).toBe(false);

    // 2. Track inexistente
    const badTrack = structuredClone(base);
    badTrack.profile.track = 'mlops';
    expect(validateGranoState(badTrack).success).toBe(false);

    // 3. Escala fuera de {0.9, 1, 1.1, 1.25}
    const badScale = structuredClone(base);
    badScale.prefs.scale = 1.5;
    expect(validateGranoState(badScale).success).toBe(false);

    // 4. Minutos de estudio negativos o tipo inválido
    const badMinutes = structuredClone(base);
    badMinutes.progress.studyMinutesByDay['2026-10-30'] = -15;
    expect(validateGranoState(badMinutes).success).toBe(false);

    const nanMinutes = structuredClone(base);
    nanMinutes.progress.studyMinutesByDay['2026-10-30'] = 'cuarenta';
    expect(validateGranoState(nanMinutes).success).toBe(false);

    // 5. Hilo del tutor con más de 30 mensajes
    const oversizedThread = structuredClone(base);
    oversizedThread.tutor.threads['c1-sql-joins-02-grano-fanout'] = Array.from({ length: 35 }, (_, i) => ({
      id: `m-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Mensaje ${i}`,
      createdAt: '2026-10-30T10:00:00.000Z',
    }));
    expect(validateGranoState(oversizedThread).success).toBe(false);
  });
});
