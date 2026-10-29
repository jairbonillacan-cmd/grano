import { z } from 'zod';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Cuenta palabras separadas por espacios en blanco en una cadena.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  if (typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export const InteractiveBlockSchema = z.object({
  component: z.string().trim().min(1, 'interactive.component no puede estar vacío'),
  caption: z.string().trim().min(1).optional(),
});

export const ExampleBlockSchema = z.object({
  language: z.string().trim().min(1, 'example.language es obligatorio'),
  code: z.string().trim().min(1, 'example.code no puede estar vacío'),
  expectedOutput: z.array(z.record(z.string(), z.any())).optional(),
});

export const SectionSchema = z.object({
  id: z.string().trim().min(1, 'section.id es obligatorio'),
  heading: z
    .string()
    .trim()
    .min(1, 'section.heading no puede estar vacío')
    .max(70, 'section.heading debe tener como máximo 70 caracteres'),
  body: z
    .string()
    .trim()
    .refine(
      (val) => {
        const w = countWords(val);
        return w >= 80 && w <= 250;
      },
      { message: 'section.body debe tener entre 80 y 250 palabras' }
    ),
  interactive: InteractiveBlockSchema.optional(),
  example: ExampleBlockSchema.optional(),
});

export const WorkedExampleStepSchema = z.object({
  label: z.string().trim().min(1).optional(),
  explanation: z.string().trim().min(1, 'Cada paso de workedExample requiere explanation'),
  code: z.string().optional(),
  expectedOutput: z.array(z.record(z.string(), z.any())).optional(),
});

export const WorkedExampleSchema = z.object({
  title: z.string().trim().min(1, 'workedExample.title es obligatorio'),
  description: z.string().trim().optional(),
  audit: z.string().trim().optional(),
  steps: z
    .array(WorkedExampleStepSchema)
    .min(2, 'workedExample.steps requiere al menos 2 pasos')
    .max(5, 'workedExample.steps admite como máximo 5 pasos'),
});

export const CheckOptionSchema = z.object({
  id: z.string().trim().min(1, 'option.id es obligatorio'),
  text: z.string().trim().min(1, 'option.text no puede estar vacío'),
  correct: z.boolean(),
  feedback: z.string().trim().min(1, 'Cada opción de check requiere feedback no vacío'),
});

export const CheckBlankSchema = z.object({
  id: z.string().trim().min(1),
  accepted: z.array(z.string().trim().min(1)).min(1),
});

export const CheckSchema = z
  .object({
    id: z.string().trim().min(1, 'check.id es obligatorio'),
    type: z.enum(['mcq', 'predict-output', 'order', 'fill-code']),
    prompt: z
      .string()
      .trim()
      .min(1, 'check.prompt no puede estar vacío')
      .refine((val) => countWords(val) <= 60, {
        message: 'check.prompt debe tener como máximo 60 palabras',
      }),
    options: z.array(CheckOptionSchema).optional(),
    items: z.array(z.string().trim().min(1)).optional(),
    correctOrder: z.array(z.string().trim().min(1)).optional(),
    template: z.string().trim().min(1).optional(),
    blanks: z.array(CheckBlankSchema).optional(),
    explanation: z
      .string()
      .trim()
      .refine(
        (val) => {
          const w = countWords(val);
          return w >= 20 && w <= 60;
        },
        { message: 'check.explanation debe tener entre 20 y 60 palabras' }
      ),
  })
  .superRefine((check, ctx) => {
    if (check.type === 'mcq' || check.type === 'predict-output') {
      if (!Array.isArray(check.options) || check.options.length < 3 || check.options.length > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: `check (${check.id}) de tipo ${check.type} debe tener entre 3 y 4 opciones`,
        });
        return;
      }
      const correctCount = check.options.filter((o) => o.correct === true).length;
      if (correctCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: `check (${check.id}) debe tener al menos una opción con correct: true`,
        });
      }
    } else if (check.type === 'order') {
      if (!Array.isArray(check.items) || check.items.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items'],
          message: `check (${check.id}) de tipo order requiere al menos 2 items`,
        });
      }
      if (!Array.isArray(check.correctOrder) || check.correctOrder.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['correctOrder'],
          message: `check (${check.id}) de tipo order requiere correctOrder`,
        });
      }
    } else if (check.type === 'fill-code') {
      if (!check.template) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['template'],
          message: `check (${check.id}) de tipo fill-code requiere template`,
        });
      }
      if (!Array.isArray(check.blanks) || check.blanks.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['blanks'],
          message: `check (${check.id}) de tipo fill-code requiere blanks`,
        });
      }
    }
  });

export const PracticeSchema = z.object({
  type: z.enum(['sql', 'fill-blanks', 'order-steps', 'open']),
  title: z.string().trim().optional(),
  language: z.string().trim().optional(),
  prompt: z.string().trim().min(1, 'practice.prompt no puede estar vacío'),
  starterCode: z.string(),
  expected: z.string().optional(),
  orderMatters: z.boolean().optional(),
  hints: z
    .array(z.string().trim().min(1, 'Cada pista debe tener texto'))
    .min(1, 'practice.hints requiere al menos 1 pista')
    .max(3, 'practice.hints admite como máximo 3 pistas'),
  solution: z.string().trim().min(1, 'practice.solution no puede estar vacío'),
  solutionExplanation: z
    .string()
    .trim()
    .min(1, 'practice.solutionExplanation no puede estar vacío'),
  blanks: z.array(z.any()).optional(),
  expectedOutput: z.any().optional(),
  expectedOutputTable: z.array(z.record(z.string(), z.any())).optional(),
  rubricCriteria: z.array(z.any()).optional(),
});

const roleNoteTextSchema = (roleLabel) =>
  z
    .string()
    .trim()
    .refine(
      (val) => {
        const w = countWords(val);
        return w >= 25 && w <= 70;
      },
      { message: `roleNotes.${roleLabel} debe tener entre 25 y 70 palabras` }
    );

export const RoleNotesSchema = z.object({
  de: roleNoteTextSchema('de').optional(),
  da: roleNoteTextSchema('da').optional(),
  bi: roleNoteTextSchema('bi').optional(),
});

export const FlashcardEmbeddedSchema = z.object({
  id: z.string().trim().min(1, 'flashcard.id es obligatorio'),
  front: z.string().trim().min(1, 'flashcard.front no puede estar vacío'),
  back: z.string().trim().min(1, 'flashcard.back no puede estar vacío'),
});

export const SourceSchema = z.object({
  title: z.string().trim().min(1, 'source.title es obligatorio'),
  url: z
    .string()
    .trim()
    .url('source.url debe ser una URL válida')
    .refine((val) => val.startsWith('https://'), {
      message: 'source.url debe usar https://',
    }),
  publisher: z.string().trim().min(1, 'source.publisher es obligatorio'),
  accessed: z
    .string()
    .trim()
    .regex(ISO_DATE_REGEX, 'source.accessed debe tener formato YYYY-MM-DD'),
  supports: z.string().trim().min(1, 'source.supports es obligatorio'),
});

export const LessonSchema = z
  .object({
    id: z
      .string()
      .trim()
      .regex(KEBAB_CASE_REGEX, 'lesson.id debe estar en formato kebab-case'),
    moduleId: z
      .string()
      .trim()
      .regex(KEBAB_CASE_REGEX, 'lesson.moduleId debe estar en formato kebab-case'),
    tracks: z
      .array(z.enum(['core', 'de', 'da', 'bi']))
      .min(1, 'lesson.tracks requiere al menos un área'),
    level: z.number().int().min(0).max(4),
    order: z.number().int().min(1),
    title: z
      .string()
      .trim()
      .min(1, 'lesson.title no puede estar vacío')
      .max(60, 'lesson.title debe tener como máximo 60 caracteres'),
    minutes: z.number().int().min(10).max(35),
    prerequisites: z.array(z.string().trim().min(1)),
    contentVersion: z.number().int().min(1),

    hook: z
      .string()
      .trim()
      .refine(
        (val) => {
          const w = countWords(val);
          return w >= 40 && w <= 90;
        },
        { message: 'lesson.hook debe tener entre 40 y 90 palabras' }
      )
      .refine((val) => /\?\s*$/.test(val), {
        message: 'lesson.hook debe terminar en signo de interrogación (?)',
      }),

    objectives: z
      .array(z.string().trim().min(5, 'Cada objetivo debe ser una frase completa'))
      .min(2, 'lesson.objectives requiere entre 2 y 4 objetivos')
      .max(4, 'lesson.objectives admite entre 2 y 4 objetivos'),

    sections: z
      .array(SectionSchema)
      .min(2, 'lesson.sections requiere entre 2 y 6 secciones')
      .max(6, 'lesson.sections admite entre 2 y 6 secciones'),

    workedExample: WorkedExampleSchema.optional(),

    checks: z
      .array(CheckSchema)
      .min(3, 'lesson.checks requiere entre 3 y 6 verificaciones')
      .max(6, 'lesson.checks admite entre 3 y 6 verificaciones'),

    practice: PracticeSchema,

    roleNotes: RoleNotesSchema.optional(),

    summary: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Frase de summary vacía')
          .refine((val) => countWords(val) <= 25, {
            message: 'Cada frase de summary debe tener como máximo 25 palabras',
          })
      )
      .min(3, 'lesson.summary requiere entre 3 y 5 frases')
      .max(5, 'lesson.summary admite entre 3 y 5 frases'),

    flashcards: z
      .array(FlashcardEmbeddedSchema)
      .min(3, 'lesson.flashcards requiere entre 3 y 6 tarjetas')
      .max(6, 'lesson.flashcards admite entre 3 y 6 tarjetas'),

    glossaryTerms: z
      .array(z.string().trim().min(1))
      .min(1, 'lesson.glossaryTerms requiere al menos 1 término'),

    sources: z
      .array(SourceSchema)
      .min(3, 'lesson.sources requiere al menos 3 fuentes verificables'),

    aiNotes: z
      .string()
      .trim()
      .min(1, 'lesson.aiNotes no puede estar vacío')
      .refine((val) => countWords(val) <= 80, {
        message: 'lesson.aiNotes debe tener como máximo 80 palabras',
      }),

    // Metadatos opcionales de migración y compatibilidad con el reproductor actual
    needsReview: z.boolean().optional(),
    legacyId: z.string().trim().optional(),
    legacyOrder: z.number().int().optional(),
    stageId: z.string().trim().optional(),
    subtitle: z.string().trim().optional(),
    goal: z.string().trim().optional(),
    pipelineChallenge: z.record(z.string(), z.any()).optional(),
    relatedLessons: z
      .array(
        z.union([
          z.string().trim().min(1),
          z.object({
            id: z.string().trim().min(1),
            reason: z.string().trim().optional(),
          }),
        ])
      )
      .optional(),
  })
  .superRefine((lesson, ctx) => {
    if (!lesson.id.startsWith(`${lesson.moduleId}-`)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['id'],
        message: `lesson.id ("${lesson.id}") debe empezar por el prefijo moduleId ("${lesson.moduleId}-")`,
      });
    }
  });

export default LessonSchema;
