import { z } from 'zod';
import { countWords, SourceSchema } from './lesson.js';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const GlossaryTermSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(KEBAB_CASE_REGEX, 'glossary.id debe estar en formato kebab-case'),
  term: z.string().trim().min(1, 'glossary.term es obligatorio'),
  englishTerm: z.string().trim().min(1).optional(),
  track: z.enum(['core', 'de', 'da', 'bi']),
  definition: z
    .string()
    .trim()
    .refine(
      (val) => {
        const w = countWords(val);
        return w >= 20 && w <= 60;
      },
      (val) => ({
        message: `glossary.definition debe tener entre 20 y 60 palabras (actual: ${countWords(val)})`,
      })
    ),
  formula: z.string().trim().optional(),
  relatedLessons: z.array(z.string().trim().min(1)).min(1),
  relatedTerms: z.array(z.string().trim().min(1)),
  sources: z.array(SourceSchema).min(1).optional(),
});

export const GlossaryListSchema = z
  .array(GlossaryTermSchema)
  .min(1, 'El glosario no puede estar vacío')
  .superRefine((terms, ctx) => {
    const seen = new Set();
    terms.forEach((item, idx) => {
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [idx, 'id'],
          message: `ID de término de glosario duplicado: "${item.id}"`,
        });
      }
      seen.add(item.id);
    });
  });

export default GlossaryTermSchema;
