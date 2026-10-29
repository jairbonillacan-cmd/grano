import { z } from 'zod';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const FlashcardSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(KEBAB_CASE_REGEX, 'flashcard.id debe estar en formato kebab-case'),
  lessonId: z
    .string()
    .trim()
    .regex(KEBAB_CASE_REGEX, 'flashcard.lessonId debe estar en formato kebab-case'),
  moduleId: z
    .string()
    .trim()
    .regex(KEBAB_CASE_REGEX, 'flashcard.moduleId debe estar en formato kebab-case'),
  track: z.enum(['core', 'de', 'da', 'bi']),
  front: z.string().trim().min(5, 'flashcard.front debe tener al menos 5 caracteres'),
  back: z.string().trim().min(5, 'flashcard.back debe tener al menos 5 caracteres'),
  tags: z.array(z.string().trim().min(1)).min(1, 'flashcard.tags requiere al menos 1 etiqueta'),
  difficulty: z.number().int().min(1).max(3),
});

export const FlashcardListSchema = z
  .array(FlashcardSchema)
  .min(1, 'La lista de flashcards no puede estar vacía')
  .superRefine((cards, ctx) => {
    const seen = new Set();
    cards.forEach((card, idx) => {
      if (seen.has(card.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [idx, 'id'],
          message: `ID de flashcard duplicado: "${card.id}"`,
        });
      }
      seen.add(card.id);
    });
  });

export default FlashcardSchema;
