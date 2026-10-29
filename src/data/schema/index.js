import {
  countWords,
  InteractiveBlockSchema,
  ExampleBlockSchema,
  SectionSchema,
  WorkedExampleStepSchema,
  WorkedExampleSchema,
  CheckOptionSchema,
  CheckBlankSchema,
  CheckSchema,
  PracticeSchema,
  RoleNotesSchema,
  FlashcardEmbeddedSchema,
  SourceSchema,
  LessonSchema,
} from './lesson.js';
import { ModuleLessonRefSchema, ModuleSchema } from './module.js';
import { GlossaryTermSchema, GlossaryListSchema } from './glossary.js';
import { FlashcardSchema, FlashcardListSchema } from './flashcard.js';

export {
  countWords,
  InteractiveBlockSchema,
  ExampleBlockSchema,
  SectionSchema,
  WorkedExampleStepSchema,
  WorkedExampleSchema,
  CheckOptionSchema,
  CheckBlankSchema,
  CheckSchema,
  PracticeSchema,
  RoleNotesSchema,
  FlashcardEmbeddedSchema,
  SourceSchema,
  LessonSchema,
  ModuleLessonRefSchema,
  ModuleSchema,
  GlossaryTermSchema,
  GlossaryListSchema,
  FlashcardSchema,
  FlashcardListSchema,
};

/**
 * Valida una lección v2 con Zod y devuelve resultado estructurado.
 * @param {unknown} data
 */
export function validateLesson(data) {
  return LessonSchema.safeParse(data);
}

/**
 * Valida un módulo con Zod.
 * @param {unknown} data
 */
export function validateModule(data) {
  return ModuleSchema.safeParse(data);
}

/**
 * Valida una lista de términos del glosario con Zod.
 * @param {unknown} data
 */
export function validateGlossary(data) {
  return GlossaryListSchema.safeParse(data);
}

/**
 * Valida una lista de flashcards con Zod.
 * @param {unknown} data
 */
export function validateFlashcards(data) {
  return FlashcardListSchema.safeParse(data);
}
