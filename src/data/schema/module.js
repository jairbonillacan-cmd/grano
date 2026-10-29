import { z } from 'zod';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ModuleLessonRefSchema = z.union([
  z.string().trim().min(1),
  z.object({
    id: z.string().trim().min(1),
    order: z.number().int().min(1),
    title: z.string().trim().min(1),
    status: z.enum(['planned', 'existing', 'ready']).optional(),
    legacyId: z.string().trim().min(1).optional(),
  }),
]);

export const ModuleSchema = z
  .object({
    id: z
      .string()
      .trim()
      .regex(KEBAB_CASE_REGEX, 'module.id debe estar en formato kebab-case'),
    title: z
      .string()
      .trim()
      .min(1, 'module.title no puede estar vacío')
      .max(60, 'module.title debe tener como máximo 60 caracteres'),
    track: z.enum(['core', 'de', 'da', 'bi']),
    level: z.number().int().min(0).max(4),
    order: z.number().int().min(1).optional(),
    summary: z.string().trim().min(1).optional(),
    goal: z.string().trim().min(1).optional(),
    project: z.string().trim().min(1).optional(),
    lessons: z
      .array(ModuleLessonRefSchema)
      .min(1, 'module.lessons requiere al menos 1 lección'),
    estimatedMinutes: z.number().int().min(10).optional(),
    prerequisites: z.array(z.string().trim().min(1)),
  })
  .superRefine((mod, ctx) => {
    if (!mod.summary && !mod.goal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: `El módulo "${mod.id}" debe incluir summary o goal`,
      });
    }
  });

export default ModuleSchema;
