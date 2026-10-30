/**
 * Puente de compatibilidad hacia `src/engine/review.js` (FSRS).
 * Se mantiene por compatibilidad con imports antiguos.
 */
export {
  BOX_INTERVALS_DAYS,
  CARD_LESSON_MAP,
  INITIAL_FLASHCARDS,
  RATING_METADATA,
  Rating,
  State,
  createFSRSCard,
  formatInterval,
  getDueCards,
  getNextIntervals,
  gradeCard,
  isCardDue,
  leitnerCardToFSRS,
  loadLeitnerState,
  normalizeRating,
  normalizeReviewState,
  previewCardRatings,
  resolveCardLessonId,
  reviewCard,
  saveLeitnerState,
  serializeFSRSCard,
} from './review.js';
