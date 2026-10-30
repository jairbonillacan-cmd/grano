// Captura la matriz visual de Grano en múltiples resoluciones, temas, densidades y estados.
// Uso:
//   node scripts/shots.mjs
//     [--url http://127.0.0.1:5174]
//     [--out docs/reportes/capturas/F0-antes]
//     [--res 1280x720,1366x768,1440x900,1920x1080,390x844]
//     [--themes light,dark]
//     [--views onboarding,home,roadmap,lesson,simulator,checks,tutor,practice,review,projects,glossary,progress,settings,ui]
//     [--state both|progress|new]
//     [--density auto|comfortable|compact]
//     [--scale 1|0.9|1.1|1.25]
//     [--sims true|false]
//     [--prefix Q3_]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) {
      const next = all[i + 1];
      pairs.push([arg.slice(2), next && !next.startsWith('--') ? next : 'true']);
    }
    return pairs;
  }, [])
);

const OUT = args.out || 'docs/reportes/capturas/F0-antes';
const BASE = (args.url || 'http://127.0.0.1:5174').replace(/\/$/, '');
const PREFIX = args.prefix || '';
const DENSITY_ARG = args.density || 'auto';
const STATE_MODE = args.state || 'both';
const SCALE = args.scale ? Number(args.scale) : null;
const RAW_SIZES = args.res || args.sizes || '1280x720,1366x768,1440x900,1920x1080,390x844';
const SIZES = RAW_SIZES.split(',').map((s) => {
  const [width, height] = s.trim().split('x').map(Number);
  return { width, height, label: s.trim() };
});
const THEMES = (args.themes || 'light,dark').split(',').map((t) => t.trim());

const ALL_VIEWS = [
  'onboarding',
  'home',
  'roadmap',
  'lesson',
  'simulator',
  'checks',
  'tutor',
  'practice',
  'review',
  'projects',
  'glossary',
  'progress',
  'settings',
  'ui',
];
const VIEWS = args.views
  ? args.views.split(',').map((v) => v.trim())
  : ALL_VIEWS;

const CAPTURE_SIMS =
  args.sims !== 'false' && (!args.views || VIEWS.includes('simulator'));

// 15 simuladores canónicos por arquetipo (§5.5 / Apéndice E.1)
const SIMULATOR_ARCHETYPES = [
  { slug: 'join-grain', lessonId: 'l1-joins-fanout' },
  { slug: 'window-frames', lessonId: 'l2-window-functions' },
  { slug: 'asof-join', lessonId: 'l3-asof-lateral-ctes' },
  { slug: 'star-vs-obt', lessonId: 'l4-star-schema-obt' },
  { slug: 'scd2-timeline', lessonId: 'l5-scd2-history' },
  { slug: 'simpson-paradox', lessonId: 'l6-metrics-simpson' },
  { slug: 'parquet-pushdown', lessonId: 'l7-columnar-parquet' },
  { slug: 'arrow-zero-copy', lessonId: 'l8-arrow-lance-vortex' },
  { slug: 'duckdb-polars', lessonId: 'l9-duckdb-polars-marimo' },
  { slug: 'medallion-flow', lessonId: 'l10-iceberg-v3-medallion' },
  { slug: 'dag-lineage', lessonId: 'l11-dbt-sqlmesh-dag' },
  { slug: 'semantic-contract', lessonId: 'l12-contracts-semantic-layer' },
  { slug: 'ab-cuped', lessonId: 'l14-ab-testing-cuped' },
  { slug: 'cdc-stream', lessonId: 'l16-cdc-kafka-streaming' },
  { slug: 'tufte-data-ink', lessonId: 'c1-viz-01-geometria-grafico' },
];

function computeCurrentWeekStudyMap() {
  const base = new Date();
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + mondayOffset);
  const sampleMinutes = [25, 40, 18, 35, 30, 15, 22];
  const map = {};
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    map[`${yyyy}-${mm}-${dd}`] = sampleMinutes[i];
  }
  return map;
}

const WEEK_STUDY_MAP = computeCurrentWeekStudyMap();

function buildSeedState({
  theme = 'light',
  density = 'auto',
  scale = 1,
  stateMode = 'progress',
  activeLessonId = 'l1-joins-fanout',
}) {
  const isNew = stateMode === 'new';
  const tutorThread = [
    {
      id: 'msg-u-1',
      role: 'user',
      createdAt: '2026-04-19T14:20:00.000Z',
      ts: '2026-04-19T14:20:00.000Z',
      content:
        '¿Cómo evito que el JOIN entre orders y order_items duplique el descuento de cabecera?',
      text: '¿Cómo evito que el JOIN entre orders y order_items duplique el descuento de cabecera?',
    },
    {
      id: 'msg-a-1',
      role: 'assistant',
      createdAt: '2026-04-19T14:20:08.000Z',
      ts: '2026-04-19T14:20:08.000Z',
      model: 'gemini-3.8-flash-low',
      elapsedMs: 420,
      content:
        'Pre-agrega la tabla hija (`order_items`) al grano de `order_id` antes de unirla con `orders`. Así conservas la relación **1:1** y evitas inflar métricas de cabecera:\n\n```sql\nWITH items_por_orden AS (\n  SELECT\n    order_id,\n    SUM(qty * unit_price) AS gross_revenue\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  o.order_id,\n  i.gross_revenue - o.header_discount AS net_revenue\nFROM orders AS o\nINNER JOIN items_por_orden AS i\n  ON o.order_id = i.order_id;\n```',
      text:
        'Pre-agrega la tabla hija (`order_items`) al grano de `order_id` antes de unirla con `orders`. Así conservas la relación **1:1** y evitas inflar métricas de cabecera:\n\n```sql\nWITH items_por_orden AS (\n  SELECT\n    order_id,\n    SUM(qty * unit_price) AS gross_revenue\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  o.order_id,\n  i.gross_revenue - o.header_discount AS net_revenue\nFROM orders AS o\nINNER JOIN items_por_orden AS i\n  ON o.order_id = i.order_id;\n```',
    },
  ];

  const lessonsProgress = isNew
    ? {}
    : {
        'c0-datos-01-que-es-dato': {
          status: 'completed',
          sectionId: 'resumen',
          stepIndex: 6,
          startedAt: '2026-04-14T09:40:00.000Z',
          completedAt: '2026-04-14T10:00:00.000Z',
          checks: { q1: { correct: true, attempts: 1 } },
          practice: { solved: true, attempts: 1 },
        },
        'c0-datos-02-tipos-esquemas': {
          status: 'completed',
          sectionId: 'resumen',
          stepIndex: 6,
          startedAt: '2026-04-15T09:40:00.000Z',
          completedAt: '2026-04-15T10:00:00.000Z',
          checks: { q1: { correct: true, attempts: 1 } },
          practice: { solved: true, attempts: 1 },
        },
        'c0-datos-05-tablas-grano': {
          status: 'completed',
          sectionId: 'resumen',
          stepIndex: 6,
          startedAt: '2026-04-16T09:40:00.000Z',
          completedAt: '2026-04-16T10:00:00.000Z',
          checks: { q1: { correct: true, attempts: 1 } },
          practice: { solved: true, attempts: 1 },
        },
        'l2-window-functions': {
          status: 'completed',
          sectionId: 'resumen',
          stepIndex: 6,
          startedAt: '2026-04-17T09:40:00.000Z',
          completedAt: '2026-04-17T10:00:00.000Z',
          checks: { q1: { correct: true, attempts: 1 }, q2: { correct: false, attempts: 2 } },
          practice: { solved: true, attempts: 1 },
        },
        [activeLessonId]: {
          status: 'in_progress',
          sectionId: 'desarrollo',
          stepIndex: 2,
          startedAt: '2026-04-18T09:40:00.000Z',
          completedAt: null,
          checks: {
            'l1-joins-fanout-c1': { optionId: 'b', correct: true, attempts: 1 },
          },
          practice: { solved: false, attempts: 1 },
        },
      };

  return {
    version: 1,
    profile: {
      track: 'de',
      startLevel: 1,
      onboarded: !isNew,
      createdAt: '2026-04-10T09:00:00.000Z',
    },
    prefs: {
      theme,
      density: density || 'auto',
      scale: scale || 1,
      aiModelFast: 'gemini-3.8-flash-low',
      aiModelDeep: 'gemini-4-argon-medium',
      aiEnabled: true,
      reducedMotion: 'on',
      sidebarCollapsed: false,
    },
    progress: {
      lessons: lessonsProgress,
      projects: isNew
        ? {}
        : {
            'cap-1-ecommerce-lakehouse': {
              completed: false,
              checkedCriteria: { 0: true, 1: true },
              updatedAt: '2026-04-18T12:00:00.000Z',
            },
          },
      diagnostic: isNew
        ? null
        : {
            recommendedTrack: 'de',
            recommendedStageId: 'core-1',
            scoreByStage: { 'core-0': 3, 'core-1': 2 },
            takenAt: '2026-04-10T09:05:00.000Z',
          },
      studyMinutesByDay: isNew ? {} : WEEK_STUDY_MAP,
    },
    review: {
      cards: isNew
        ? {}
        : {
            'fc-01': {
              stability: 2.4,
              difficulty: 5.2,
              elapsed_days: 4,
              scheduled_days: 3,
              learning_steps: 0,
              reps: 2,
              lapses: 0,
              state: 2,
              due: '2026-04-01T00:00:00.000Z',
              last_review: '2026-03-28T00:00:00.000Z',
            },
            'fc-02': {
              stability: 3.1,
              difficulty: 4.8,
              elapsed_days: 4,
              scheduled_days: 4,
              learning_steps: 0,
              reps: 3,
              lapses: 0,
              state: 2,
              due: '2026-04-02T00:00:00.000Z',
              last_review: '2026-03-29T00:00:00.000Z',
            },
          },
    },
    tutor: {
      threads: isNew
        ? {}
        : {
            [activeLessonId]: tutorThread,
            'l1-joins-fanout': tutorThread,
            'l01-grain-join-fanout': tutorThread,
            'c1-sql-05-granularity-fanout-joins': tutorThread,
          },
    },
  };
}

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch {}
  }
  return chromium.launch();
}

const VIEW_QUERY_MAP = {
  onboarding: '/?view=onboarding',
  home: '/?view=home',
  roadmap: '/?view=roadmap',
  lesson: '/?view=lesson',
  simulator: '/?view=lesson',
  checks: '/?view=lesson',
  tutor: '/?view=lesson',
  practice: '/?view=practice',
  review: '/?view=review',
  projects: '/?view=capstones',
  glossary: '/?view=glossary',
  progress: '/?view=analytics',
  settings: '/?view=settings',
  ui: '/?ui=1',
};

async function scrollElementBelowStickyBars(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetTop = Math.max(0, window.scrollY + rect.top - 116);
    window.scrollTo({ top: targetTop, left: 0, behavior: 'instant' });
  }, selector);
}

async function openView(page, view, seedOpts) {
  const route = VIEW_QUERY_MAP[view];
  if (!route) return false;

  const stateObj = buildSeedState(seedOpts);
  const hasOrigin = page.url().startsWith(BASE);

  if (hasOrigin) {
    await page.evaluate(
      ({ state, theme }) => {
        try {
          sessionStorage.setItem('shots-next-seed', JSON.stringify(state));
          sessionStorage.setItem('shots-next-theme', theme);
          localStorage.setItem('manual_datos_theme', theme);
          localStorage.setItem('grano:v1', JSON.stringify(state));
        } catch {}
      },
      { state: stateObj, theme: seedOpts.theme }
    );
  }

  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(220);

  if (view === 'practice') {
    await page
      .locator('.practice-loading')
      .waitFor({ state: 'detached', timeout: 5000 })
      .catch(() => {});
    await page
      .locator('.practice-view')
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(150);
    return true;
  }

  if (view === 'review') {
    const showAnsBtn = page
      .getByRole('button', { name: /Mostrar respuesta/i })
      .first();
    if (await showAnsBtn.isVisible().catch(() => false)) {
      await showAnsBtn.click().catch(() => {});
      await page.waitForTimeout(120);
    }
    return true;
  }

  if (view === 'simulator') {
    await scrollElementBelowStickyBars(
      page,
      '#sec-desarrollo .lp-simulator-frame, .lp-simulator-frame, .sim-frame'
    );
    await page.waitForTimeout(160);
    return true;
  }

  if (view === 'checks') {
    await scrollElementBelowStickyBars(page, '#sec-comprobaciones, .lp-check-card');
    await page.waitForTimeout(140);
    const option = page.locator('.lp-check-card__option').nth(1);
    if (await option.isVisible().catch(() => false)) {
      await option.click().catch(() => {});
      const verifyBtn = page.locator('.lp-check-card__actions .lp-btn--primary').first();
      if (await verifyBtn.isVisible().catch(() => false)) {
        await verifyBtn.click().catch(() => {});
      }
      await page.waitForTimeout(140);
    }
    await scrollElementBelowStickyBars(page, '#sec-comprobaciones, .lp-check-card');
    return true;
  }

  if (view === 'tutor') {
    const askBtn = page
      .locator('.app-topbar__ask-btn')
      .or(page.getByRole('button', { name: /Preguntar|Alternar panel de Tutor IA/i }))
      .first();
    if (await askBtn.isVisible().catch(() => false)) {
      await askBtn.click();
      await page.waitForTimeout(220);
      return true;
    }
    return false;
  }

  return true;
}

const browser = await launch();
fs.mkdirSync(OUT, { recursive: true });
const missing = [];
let saved = 0;

// Construir lista de trabajos (size, theme, density, suffix)
const jobs = [];
for (const size of SIZES) {
  for (const theme of THEMES) {
    const baseDensity = DENSITY_ARG === 'auto' ? 'auto' : DENSITY_ARG;
    const baseSuffix = DENSITY_ARG && DENSITY_ARG !== 'auto' ? `_${DENSITY_ARG}` : '';
    jobs.push({
      size,
      theme,
      density: baseDensity,
      densitySuffix: baseSuffix,
      includeNewHome: STATE_MODE !== 'progress',
    });

    // Si estamos en modo auto y la resolución es 1920x1080, capturar también densidad compacta explícita (Apéndice E.1)
    if (DENSITY_ARG === 'auto' && size.label === '1920x1080') {
      jobs.push({
        size,
        theme,
        density: 'compact',
        densitySuffix: '_compact',
        includeNewHome: false,
      });
    }
  }
}

async function runJob(job) {
  const { size, theme, density, densitySuffix, includeNewHome } = job;
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    colorScheme: theme,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });

  const firstView = VIEWS[0] || 'home';
  const initialMode =
    firstView === 'onboarding' ? 'new' : STATE_MODE === 'new' ? 'new' : 'progress';
  const initialSeed = buildSeedState({
    theme,
    density,
    scale: SCALE || 1,
    stateMode: initialMode,
  });

  // Se ejecuta en cada documento nuevo ANTES que store.js, sobrescribiendo cualquier flush de beforeunload
  await context.addInitScript(
    ({ defaultState, defaultTheme }) => {
      try {
        const nextRaw = sessionStorage.getItem('shots-next-seed');
        const nextTheme = sessionStorage.getItem('shots-next-theme') || defaultTheme;
        localStorage.setItem('manual_datos_theme', nextTheme);
        localStorage.setItem('grano:v1', nextRaw || JSON.stringify(defaultState));
      } catch {}
    },
    { defaultState: initialSeed, defaultTheme: theme }
  );

  const page = await context.newPage();
  const scaleSuffix = SCALE && SCALE !== 1 ? `_scale${Math.round(SCALE * 100)}` : '';

  for (const view of VIEWS) {
    const modeForView =
      view === 'onboarding' ? 'new' : STATE_MODE === 'new' ? 'new' : 'progress';
    const seedOpts = {
      theme,
      density,
      scale: SCALE || 1,
      stateMode: modeForView,
    };

    const ok = await openView(page, view, seedOpts).catch(() => false);
    if (!ok) {
      missing.push(`${view} ${size.label} ${theme}${densitySuffix}`);
      continue;
    }

    const file = path.join(
      OUT,
      `${PREFIX}${view}_${size.label}_${theme}${densitySuffix}${scaleSuffix}.png`
    );
    await page.screenshot({ path: file, fullPage: false });
    saved += 1;

    // Capturar los 3 pasos de onboarding en 1280x720 y 1440x900 (sin sufijo compact extra)
    if (
      view === 'onboarding' &&
      !densitySuffix &&
      (size.label === '1280x720' || size.label === '1440x900')
    ) {
      const nextStepBtn = page
        .getByRole('button', { name: /Elegir nivel de partida|Continuar/i })
        .first();
      if (await nextStepBtn.isVisible().catch(() => false)) {
        await nextStepBtn.click().catch(() => {});
        await page.waitForTimeout(180);
        const step2File = path.join(
          OUT,
          `${PREFIX}onboarding_step2_${size.label}_${theme}${scaleSuffix}.png`
        );
        await page.screenshot({ path: step2File, fullPage: false });
        saved += 1;

        const step3Btn = page
          .getByRole('button', { name: /Ver primera lección|Continuar/i })
          .first();
        if (await step3Btn.isVisible().catch(() => false)) {
          await step3Btn.click().catch(() => {});
          await page.waitForTimeout(180);
          const step3File = path.join(
            OUT,
            `${PREFIX}onboarding_step3_${size.label}_${theme}${scaleSuffix}.png`
          );
          await page.screenshot({ path: step3File, fullPage: false });
          saved += 1;
        }
      }
    }

    // Si estamos en home y se solicitó estado new/both, capturar también home_new_<res>_<theme>.png
    if (view === 'home' && includeNewHome && STATE_MODE === 'both') {
      const okNew = await openView(page, 'home', {
        theme,
        density,
        scale: SCALE || 1,
        stateMode: 'new',
      }).catch(() => false);
      if (okNew) {
        const newFile = path.join(
          OUT,
          `${PREFIX}home_new_${size.label}_${theme}${densitySuffix}${scaleSuffix}.png`
        );
        await page.screenshot({ path: newFile, fullPage: false });
        saved += 1;
      }
    }
  }

  await context.close();
}

// Ejecutar trabajos en lotes de 4 contextos en paralelo
const CONCURRENCY = 4;
for (let i = 0; i < jobs.length; i += CONCURRENCY) {
  const chunk = jobs.slice(i, i + CONCURRENCY);
  await Promise.all(chunk.map((job) => runJob(job)));
}

// Capturar los 15 arquetipos de simulador en 1440x900 light
if (CAPTURE_SIMS) {
  const simContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const initialSimSeed = buildSeedState({
    theme: 'light',
    density: 'auto',
    scale: 1,
    stateMode: 'progress',
    activeLessonId: SIMULATOR_ARCHETYPES[0].lessonId,
  });
  await simContext.addInitScript(
    ({ defaultState }) => {
      try {
        const nextRaw = sessionStorage.getItem('shots-next-seed');
        localStorage.setItem('manual_datos_theme', 'light');
        localStorage.setItem('grano:v1', nextRaw || JSON.stringify(defaultState));
      } catch {}
    },
    { defaultState: initialSimSeed }
  );
  const simPage = await simContext.newPage();

  for (const sim of SIMULATOR_ARCHETYPES) {
    const seedOpts = {
      theme: 'light',
      density: 'auto',
      scale: 1,
      stateMode: 'progress',
      activeLessonId: sim.lessonId,
    };
    const ok = await openView(simPage, 'simulator', seedOpts).catch(() => false);
    if (!ok) {
      missing.push(`sim_${sim.slug}`);
      continue;
    }
    const simFile = path.join(OUT, `${PREFIX}sim_${sim.slug}_1440x900_light.png`);
    await simPage.screenshot({ path: simFile, fullPage: false });
    saved += 1;
  }

  await simContext.close();
}

await browser.close();
console.log(`Capturas guardadas: ${saved} en ${OUT}`);
if (missing.length) {
  console.log(`No se pudieron abrir (${missing.length}): ${missing.join(' | ')}`);
}
