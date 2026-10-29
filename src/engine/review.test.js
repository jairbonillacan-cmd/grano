import { describe, it, expect, beforeEach } from 'vitest';
import {
  INITIAL_FLASHCARDS,
  Rating,
  State,
  createFSRSCard,
  formatInterval,
  getDueCards,
  getNextIntervals,
  gradeCard,
  leitnerCardToFSRS,
  normalizeRating,
  previewCardRatings,
  reviewCard,
  setReviewStateProvider,
} from './review.js';

describe('Motor de Repaso Espaciado FSRS (src/engine/review.js)', () => {
  const fixedNow = new Date('2026-10-29T12:00:00.000Z');

  beforeEach(() => {
    setReviewStateProvider(null);
  });

  it('1. crea una tarjeta FSRS nueva en estado New (0) y vencida en la fecha indicada', () => {
    const card = createFSRSCard(fixedNow, 'fc-01');
    expect(card.cardId).toBe('fc-01');
    expect(card.state).toBe(State.New);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.stability).toBe(0);
    expect(card.due).toBe(fixedNow.toISOString());
    expect(card.last_review).toBeNull();
  });

  it('2. normaliza calificaciones en texto o número (Again/Hard/Good/Easy y 1..4)', () => {
    expect(normalizeRating('again')).toBe(Rating.Again);
    expect(normalizeRating('Again')).toBe(Rating.Again);
    expect(normalizeRating(1)).toBe(Rating.Again);

    expect(normalizeRating('hard')).toBe(Rating.Hard);
    expect(normalizeRating('Difícil')).toBe(Rating.Hard);
    expect(normalizeRating(2)).toBe(Rating.Hard);

    expect(normalizeRating('good')).toBe(Rating.Good);
    expect(normalizeRating('Bien')).toBe(Rating.Good);
    expect(normalizeRating(3)).toBe(Rating.Good);

    expect(normalizeRating('easy')).toBe(Rating.Easy);
    expect(normalizeRating('Fácil')).toBe(Rating.Easy);
    expect(normalizeRating(4)).toBe(Rating.Easy);
  });

  it('3. programa intervalos crecientes donde Bien/Fácil alejan la fecha más que Otra vez/Difícil', () => {
    const card = createFSRSCard(fixedNow, 'fc-01');
    const previews = previewCardRatings(card, fixedNow);

    const againDue = new Date(previews.again.due).getTime();
    const hardDue = new Date(previews.hard.due).getTime();
    const goodDue = new Date(previews.good.due).getTime();
    const easyDue = new Date(previews.easy.due).getTime();

    expect(againDue).toBeGreaterThan(fixedNow.getTime());
    expect(hardDue).toBeGreaterThan(againDue);
    expect(goodDue).toBeGreaterThan(hardDue);
    expect(easyDue).toBeGreaterThan(goodDue);

    // También expone las claves numéricas 1..4 y capitalizadas Again..Easy
    expect(previews[1].intervalLabel).toBe('1 min');
    expect(previews.Good.intervalLabel).toBe('10 min');
    expect(previews.Easy.intervalLabel).toMatch(/^\d+ d$/);
  });

  it('4. formatea intervalos legibles en minutos, horas, días y meses para los 4 botones', () => {
    expect(formatInterval(30 * 1000)).toBe('1 min');
    expect(formatInterval(10 * 60 * 1000)).toBe('10 min');
    expect(formatInterval(3 * 60 * 60 * 1000)).toBe('3 h');
    expect(formatInterval(2 * 24 * 60 * 60 * 1000)).toBe('2 d');
    expect(formatInterval(45 * 24 * 60 * 60 * 1000)).toBe('2 meses');
  });

  it('5. evoluciona una tarjeta a través de múltiples repasos con FSRS y aumenta su estabilidad', () => {
    const startCard = createFSRSCard(fixedNow, 'fc-02');
    const step1 = gradeCard(startCard, 'good', fixedNow);
    expect(step1.card.reps).toBe(1);
    expect(step1.card.stability).toBeGreaterThan(0);

    const step1DueDate = new Date(step1.card.due);
    const step2 = gradeCard(step1.card, 'good', step1DueDate);
    expect(step2.card.reps).toBe(2);
    expect(step2.card.state).toBe(State.Review);
    expect(step2.card.scheduled_days).toBeGreaterThanOrEqual(1);
    expect(step2.intervalLabel).toMatch(/^\d+ d$/);

    // Si en el siguiente repaso responde "again", incrementa lapses y pasa a Relearning
    const step2DueDate = new Date(step2.card.due);
    const step3Again = gradeCard(step2.card, 'again', step2DueDate);
    expect(step3Again.card.lapses).toBe(1);
    expect(step3Again.card.state).toBe(State.Relearning);
    expect(new Date(step3Again.card.due).getTime()).toBeLessThan(
      new Date(gradeCard(step2.card, 'good', step2DueDate).card.due).getTime()
    );
  });

  it('6. solo muestra como pendientes tarjetas de lecciones iniciadas o completadas', () => {
    // Sin lecciones iniciadas -> 0 tarjetas pendientes
    const dueWhenEmpty = getDueCards({}, { startedLessonIds: [], now: fixedNow });
    expect(dueWhenEmpty).toEqual([]);

    // Con solo l1-joins-fanout iniciada -> solo aparece fc-01
    const dueForL1 = getDueCards(
      {},
      {
        lessons: {
          'l1-joins-fanout': { status: 'in_progress', stepIndex: 1 },
          'l2-window-functions': { status: 'not_started', stepIndex: 0 },
        },
        now: fixedNow,
      }
    );
    expect(dueForL1.map((c) => c.id)).toEqual(['fc-01']);

    // Con l6-metrics-simpson completada -> aparecen fc-06 y fc-07
    const dueForL1AndL6 = getDueCards(
      {},
      {
        lessons: {
          'l1-joins-fanout': { status: 'in_progress', stepIndex: 1 },
          'l6-metrics-simpson': { status: 'completed' },
        },
        now: fixedNow,
      }
    );
    expect(dueForL1AndL6.map((c) => c.id)).toEqual(['fc-01', 'fc-06', 'fc-07']);
  });

  it('7. deja de mostrar una tarjeta como pendiente tras repasarla hasta que llegue su nueva fecha due', () => {
    const stateAfterReview = reviewCard({}, 'fc-01', 'easy', fixedNow);
    const lessons = { 'l1-joins-fanout': { status: 'completed' } };

    // En fixedNow ya no está vencida porque fue programada varios días en el futuro
    const dueImmediately = getDueCards(stateAfterReview.cards, {
      lessons,
      now: fixedNow,
    });
    expect(dueImmediately).toEqual([]);

    // 15 días después vuelve a estar pendiente
    const futureDate = new Date(fixedNow.getTime() + 15 * 24 * 60 * 60 * 1000);
    const dueInFuture = getDueCards(stateAfterReview.cards, {
      lessons,
      now: futureDate,
    });
    expect(dueInFuture.map((c) => c.id)).toEqual(['fc-01']);
  });

  it('8. convierte tarjetas del antiguo sistema Leitner a FSRS preservando repasos y vencimiento', () => {
    const legacyCard = {
      cardId: 'fc-05',
      box: 4,
      intervalDays: 14,
      nextReviewAt: fixedNow.getTime() + 5 * 24 * 60 * 60 * 1000,
      lastReviewedAt: fixedNow.getTime() - 9 * 24 * 60 * 60 * 1000,
      reviewCount: 4,
      streak: 3,
      lapses: 1,
    };

    const converted = leitnerCardToFSRS(legacyCard, 'fc-05', fixedNow);
    expect(converted.reps).toBe(4);
    expect(converted.lapses).toBe(1);
    expect(converted.scheduled_days).toBe(14);
    expect(converted.stability).toBeGreaterThanOrEqual(14);
    expect(converted.state).toBe(State.Review);
    expect(new Date(converted.due).getTime()).toBe(legacyCard.nextReviewAt);

    // Y puede seguir programándose con getNextIntervals
    const next = getNextIntervals(converted, new Date(legacyCard.nextReviewAt));
    expect(new Date(next.good.due).getTime()).toBeGreaterThan(legacyCard.nextReviewAt);
  });

  it('9. soporta alias de IDs nuevos v2 (c1-sql-joins-02-grano-fanout) al filtrar lecciones iniciadas', () => {
    const due = getDueCards(
      {},
      {
        startedLessonIds: ['c1-sql-joins-02-grano-fanout'],
        now: fixedNow,
      }
    );
    expect(due.length).toBe(1);
    expect(due[0].id).toBe('fc-01');
    expect(INITIAL_FLASHCARDS.length).toBe(24);
  });
});
