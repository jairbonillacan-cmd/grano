import { z } from 'zod';

/**
 * Esquema Zod para el modo `feynman` ("Explícalo con tus palabras").
 * Valida `{ score: 0..4, aciertos: string[], huecos: string[], siguientePaso: string }`.
 */
export const FeynmanRubricSchema = z.object({
  score: z.number().int().min(0).max(4),
  aciertos: z.array(z.string().min(1)).min(1).max(8),
  huecos: z.array(z.string()).max(8),
  siguientePaso: z.string().min(1).max(800),
});

/**
 * Esquema Zod para una opción de pregunta en `quiz-more`.
 */
export const QuizMoreOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
  feedback: z.string().min(1),
});

/**
 * Esquema Zod para una pregunta individual en `quiz-more`.
 */
export const QuizMoreQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z
    .array(QuizMoreOptionSchema)
    .min(3)
    .max(4)
    .refine(
      (opts) => opts.filter((o) => o.correct).length === 1,
      'Cada pregunta debe tener exactamente una opción correcta.'
    ),
  explanation: z.string().min(1),
});

/**
 * Esquema Zod para el modo `quiz-more` ("Dame 3 preguntas más").
 */
export const QuizMoreSchema = z.object({
  questions: z.array(QuizMoreQuestionSchema).min(1).max(5),
});

/**
 * Esquema Zod para el modo `interview-grade` / `interview` ("Simulacro de entrevista").
 */
export const InterviewGradeSchema = z.object({
  score: z.number().int().min(0).max(4),
  fortalezas: z.array(z.string().min(1)).min(1).max(8),
  mejoras: z.array(z.string()).max(8),
  respuestaModelo: z.string().min(1).max(1500),
  siguientePregunta: z.string().optional(),
});

export const AI_JSON_SCHEMAS = {
  feynman: FeynmanRubricSchema,
  'quiz-more': QuizMoreSchema,
  'interview-grade': InterviewGradeSchema,
  interview: InterviewGradeSchema,
};

/**
 * Valida la respuesta JSON devuelta por `/api/ai/json` según el modo solicitado.
 */
export function validateAiJsonOutput(mode, rawData) {
  const schema = AI_JSON_SCHEMAS[mode];
  if (!schema) {
    return {
      ok: false,
      error: `Modo JSON desconocido: ${String(mode)}`,
      issues: [],
    };
  }
  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    return {
      ok: false,
      error:
        firstIssue?.message ||
        'La respuesta JSON del modelo no cumple el esquema esperado.',
      issues: parsed.error.issues,
    };
  }
  return {
    ok: true,
    data: parsed.data,
  };
}
