import { z } from 'zod';

export const STATE_VERSION = 1;
export const STORAGE_KEY = 'grano:v1';
export const MAX_TUTOR_MESSAGES_PER_LESSON = 30;

export const TrackSchema = z.enum(['de', 'da', 'bi']).nullable();

export const ScaleSchema = z.union([
  z.literal(0.9),
  z.literal(1),
  z.literal(1.1),
  z.literal(1.25),
]);

export const ThemeSchema = z.enum(['system', 'light', 'dark']);
export const DensitySchema = z.enum(['auto', 'comfortable', 'compact']);
export const ReducedMotionSchema = z.enum(['system', 'on']);

export const ProfileSchema = z.object({
  track: TrackSchema.default(null),
  startLevel: z.number().int().min(0).max(4).default(0),
  onboarded: z.boolean().default(false),
  createdAt: z.string().min(1),
});

export const PrefsSchema = z.object({
  theme: ThemeSchema.default('system'),
  density: DensitySchema.default('auto'),
  scale: ScaleSchema.default(1),
  aiModelFast: z.string().min(1).default('gemini-3.8-flash-low'),
  aiModelDeep: z.string().min(1).default('gemini-4-argon-medium'),
  aiEnabled: z.boolean().default(true),
  reducedMotion: ReducedMotionSchema.default('system'),
  sidebarCollapsed: z.boolean().default(false),
});

export const LessonStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'known',
]);

export const CheckEntrySchema = z.union([
  z.string(),
  z.boolean(),
  z.number(),
  z
    .object({
      optionId: z.string().nullable().optional(),
      correct: z.boolean().optional(),
      attempts: z.number().int().min(0).optional(),
      answeredAt: z.string().nullable().optional(),
    })
    .passthrough(),
]);

export const PracticeEntrySchema = z
  .object({
    solved: z.boolean().default(false),
    codeSolved: z.boolean().optional(),
    pipelineSolved: z.boolean().optional(),
    lastCode: z.string().optional(),
    attempts: z.number().int().min(0).optional(),
    solvedAt: z.string().nullable().optional(),
  })
  .passthrough();

export const LessonProgressSchema = z.object({
  status: LessonStatusSchema.default('not_started'),
  sectionId: z.string().nullable().default(null),
  stepIndex: z.number().int().min(0).default(0),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  checks: z.record(z.string(), CheckEntrySchema).default({}),
  practice: PracticeEntrySchema.default({ solved: false }),
});

export const ProjectProgressSchema = z
  .object({
    completed: z.boolean().default(false),
    completedAt: z.string().nullable().optional(),
    repoUrl: z.string().optional(),
    draft: z.string().optional(),
    rubric: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

export const ProgressSchema = z.object({
  lessons: z.record(z.string(), LessonProgressSchema).default({}),
  projects: z.record(z.string(), ProjectProgressSchema).default({}),
  diagnostic: z.any().nullable().default(null),
  studyMinutesByDay: z.record(z.string(), z.number().min(0)).default({}),
});

const IsoOrDateStringSchema = z
  .union([z.string(), z.date()])
  .refine(
    (val) => {
      if (val instanceof Date) return !Number.isNaN(val.getTime());
      return typeof val === 'string' && val.length > 0 && !Number.isNaN(Date.parse(val));
    },
    { message: 'Fecha ISO inválida en tarjeta FSRS' }
  )
  .transform((val) => (val instanceof Date ? val.toISOString() : val));

export const FSRSCardSchema = z
  .object({
    due: IsoOrDateStringSchema,
    stability: z.number().min(0),
    difficulty: z.number().min(0),
    elapsed_days: z.number().min(0).default(0),
    scheduled_days: z.number().min(0),
    learning_steps: z.number().int().min(0).default(0),
    reps: z.number().int().min(0),
    lapses: z.number().int().min(0),
    state: z.number().int().min(0).max(3),
    last_review: z
      .union([IsoOrDateStringSchema, z.null(), z.undefined()])
      .optional()
      .transform((val) => val ?? null),
  })
  .passthrough();

export const ReviewSchema = z.object({
  cards: z.record(z.string(), FSRSCardSchema).default({}),
});

export const TutorMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']).default('assistant'),
    content: z.string(),
    createdAt: z.string().optional(),
    model: z.string().optional(),
    elapsedMs: z.number().min(0).optional(),
    isError: z.boolean().optional(),
    source: z.string().optional(),
    question: z.string().optional(),
    answer: z.string().optional(),
  })
  .passthrough();

export const TutorSchema = z.object({
  threads: z
    .record(z.string(), z.array(TutorMessageSchema).max(MAX_TUTOR_MESSAGES_PER_LESSON))
    .default({}),
});

export const GranoStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  profile: ProfileSchema,
  prefs: PrefsSchema,
  progress: ProgressSchema,
  review: ReviewSchema,
  tutor: TutorSchema,
});

export function normalizeScaleValue(rawScale) {
  if (rawScale === 0.9 || rawScale === '0.9' || rawScale === 0.8 || rawScale === '0.8') {
    return 0.9;
  }
  if (rawScale === 1.1 || rawScale === '1.1') {
    return 1.1;
  }
  if (rawScale === 1.25 || rawScale === '1.25') {
    return 1.25;
  }
  return 1;
}

export function normalizeTrackValue(rawTrack) {
  if (typeof rawTrack !== 'string') return null;
  const clean = rawTrack.trim().toLowerCase();
  if (clean === 'de' || clean === 'da' || clean === 'bi') {
    return clean;
  }
  return null;
}

export function normalizeThemeValue(rawTheme) {
  if (rawTheme === 'light' || rawTheme === 'dark' || rawTheme === 'system') {
    return rawTheme;
  }
  return 'system';
}

export function normalizeDensityValue(rawDensity) {
  if (rawDensity === 'auto' || rawDensity === 'comfortable' || rawDensity === 'compact') {
    return rawDensity;
  }
  return 'auto';
}

export function normalizeReducedMotionValue(rawMotion) {
  if (rawMotion === 'on' || rawMotion === true || rawMotion === 'true') {
    return 'on';
  }
  return 'system';
}

export function createDefaultLessonProgress(overrides = {}) {
  return {
    status: 'not_started',
    sectionId: null,
    stepIndex: 0,
    startedAt: null,
    completedAt: null,
    checks: {},
    practice: { solved: false },
    ...overrides,
  };
}

export function createInitialState(now = new Date()) {
  const createdAt = (now instanceof Date ? now : new Date(now)).toISOString();
  return {
    version: STATE_VERSION,
    profile: {
      track: null,
      startLevel: 0,
      onboarded: false,
      createdAt,
    },
    prefs: {
      theme: 'system',
      density: 'auto',
      scale: 1,
      aiModelFast: 'gemini-3.8-flash-low',
      aiModelDeep: 'gemini-4-argon-medium',
      aiEnabled: true,
      reducedMotion: 'system',
      sidebarCollapsed: false,
    },
    progress: {
      lessons: {},
      projects: {},
      diagnostic: null,
      studyMinutesByDay: {},
    },
    review: {
      cards: {},
    },
    tutor: {
      threads: {},
    },
  };
}

export function validateGranoState(candidate) {
  return GranoStateSchema.safeParse(candidate);
}
