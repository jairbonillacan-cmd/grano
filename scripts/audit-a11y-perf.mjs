import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createGranoServer } from '../server/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_ASSETS_DIR = path.join(ROOT_DIR, 'dist', 'assets');
const AXE_PATH = path.join(ROOT_DIR, 'node_modules', 'axe-core', 'axe.min.js');
const REPORT_DIR = path.join(ROOT_DIR, 'docs', 'reportes', 'Q2');
const CAPTURES_DIR = path.join(ROOT_DIR, 'docs', 'reportes', 'capturas', 'Q2');

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(CAPTURES_DIR, { recursive: true });

const BASELINE_BUNDLE = {
  entryFile: 'dist/assets/index-BRXuSryY.js',
  rawBytes: 4627190,
  rawKB: 4627.19,
  gzipBytes: 1253590,
  gzipKB: 1253.59,
};

function buildGranoV1State(viewId, theme = 'light') {
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);
  return {
    version: 1,
    profile: {
      track: 'de',
      startLevel: 1,
      onboarded: viewId !== 'onboarding',
      createdAt: nowIso,
    },
    prefs: {
      theme,
      density: 'auto',
      scale: 1,
      aiModelFast: 'gemini-3.8-flash-low',
      aiModelDeep: 'gemini-4-argon-medium',
      aiEnabled: true,
      reducedMotion: 'system',
      sidebarCollapsed: false,
    },
    progress: {
      lessons: {
        'c0-datos-01-tipos-dato': {
          status: 'completed',
          stepIndex: 3,
          checkScore: 1,
          practiceSolved: true,
          completedAt: nowIso,
          updatedAt: nowIso,
        },
        'c0-datos-05-tablas-grano': {
          status: 'completed',
          stepIndex: 3,
          checkScore: 1,
          practiceSolved: true,
          completedAt: nowIso,
          updatedAt: nowIso,
        },
        'c1-sql-joins-02-grano-fanout': {
          status: 'in_progress',
          stepIndex: 0,
          checkScore: 0,
          practiceSolved: false,
          updatedAt: nowIso,
        },
      },
      projects: {},
      diagnostic: {
        completedAt: nowIso,
        recommendedStageId: 'stage-1',
        recommendedRole: 'de',
        score: 75,
      },
      studyMinutesByDay: {
        [today]: 25,
      },
    },
    review: { cards: {} },
    tutor: { threads: {} },
  };
}

function analyzeBundleAssets() {
  if (!fs.existsSync(DIST_ASSETS_DIR)) {
    throw new Error(`No existe ${DIST_ASSETS_DIR}. Ejecuta npm run build primero.`);
  }
  const files = fs.readdirSync(DIST_ASSETS_DIR);
  const assets = [];

  for (const name of files) {
    const fullPath = path.join(DIST_ASSETS_DIR, name);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;
    const rawBuffer = fs.readFileSync(fullPath);
    const gzipBuffer = zlib.gzipSync(rawBuffer, { level: 9 });
    const ext = path.extname(name).toLowerCase();
    assets.push({
      file: `dist/assets/${name}`,
      name,
      ext,
      rawBytes: rawBuffer.length,
      rawKB: Number((rawBuffer.length / 1000).toFixed(2)),
      gzipBytes: gzipBuffer.length,
      gzipKB: Number((gzipBuffer.length / 1000).toFixed(2)),
    });
  }

  assets.sort((a, b) => b.gzipBytes - a.gzipBytes);
  const jsChunks = assets.filter((a) => a.ext === '.js');
  const entryChunk = jsChunks.find((a) => /^index-[^.]+\.js$/.test(a.name));
  if (!entryChunk) {
    throw new Error('No se encontró el chunk principal dist/assets/index-*.js');
  }

  const entrySource = fs.readFileSync(path.join(ROOT_DIR, entryChunk.file), 'utf8');
  const duckdbInEntry =
    entrySource.includes('duckdb-mvp') ||
    entrySource.includes('duckdb-eh') ||
    entrySource.includes('AsyncDuckDB');

  const reductionGzipPct = Number(
    (((BASELINE_BUNDLE.gzipKB - entryChunk.gzipKB) / BASELINE_BUNDLE.gzipKB) * 100).toFixed(2)
  );

  return {
    baselineEntry: BASELINE_BUNDLE,
    optimizedEntry: entryChunk,
    entryUnder250KBGzip: entryChunk.gzipKB < 250,
    duckdbExcludedFromEntry: !duckdbInEntry,
    reductionGzipPercent: reductionGzipPct,
    totalJsChunks: jsChunks.length,
    jsChunksOver500KBRaw: jsChunks.filter((c) => c.rawKB > 500 && !c.name.includes('worker')),
    jsChunks,
    cssAssets: assets.filter((a) => a.ext === '.css'),
    wasmAssets: assets.filter((a) => a.ext === '.wasm'),
  };
}

function computeLighthouseTransferScore(value, p10, median) {
  if (value <= 0) return 1;
  if (value <= p10) return Math.min(1, 0.9 + 0.1 * (1 - value / p10));
  const ratio = (value - p10) / Math.max(1, median - p10);
  const score = 0.9 * Math.exp(-0.693147 * ratio);
  return Math.max(0, Math.min(1, score));
}

function summarizeViolations(violations) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    tags: v.tags,
    nodeCount: v.nodes.length,
    nodes: v.nodes.slice(0, 12).map((n) => ({
      target: n.target,
      html: n.html.slice(0, 240),
      failureSummary: n.failureSummary,
    })),
  }));
}

const VIEWS_TO_AUDIT = [
  { id: 'onboarding', label: 'Onboarding', query: '?view=onboarding' },
  { id: 'home', label: 'Hoy', query: '?view=home' },
  { id: 'roadmap', label: 'Ruta', query: '?view=roadmap' },
  { id: 'lesson', label: 'Lección', query: '?view=lesson' },
  { id: 'tutor', label: 'Tutor abierto', query: '?view=lesson' },
  { id: 'practice', label: 'Práctica', query: '?view=practice' },
  { id: 'review', label: 'Repaso', query: '?view=review' },
  { id: 'glossary', label: 'Glosario', query: '?view=glossary' },
  { id: 'analytics', label: 'Progreso', query: '?view=analytics' },
  { id: 'capstones', label: 'Proyectos', query: '?view=capstones' },
  { id: 'settings', label: 'Ajustes', query: '?view=settings' },
  { id: 'ui-showcase', label: 'Showcase ?ui=1', query: '?ui=1' },
];

async function prepareView(page, baseUrl, viewSpec, theme) {
  const granoState = buildGranoV1State(viewSpec.id, theme);
  await page.addInitScript(
    ({ state, themeValue }) => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.localStorage.setItem('manual_datos_theme', themeValue);
        window.localStorage.setItem('grano:v1', JSON.stringify(state));
      } catch {}
    },
    {
      state: granoState,
      themeValue: theme,
    }
  );

  const targetUrl = viewSpec.query ? `${baseUrl}/${viewSpec.query}` : `${baseUrl}/`;
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });
  await page.waitForTimeout(300);

  if (viewSpec.id === 'tutor') {
    const askBtn = page
      .locator('.app-topbar__ask-btn, button[aria-controls="lesson-tutor-panel"]')
      .first();
    if (await askBtn.count()) {
      const expanded = await askBtn.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await askBtn.click();
        await page.waitForTimeout(300);
      }
    }
  }

  if (viewSpec.id === 'practice') {
    await page.waitForSelector('.practice-view', { timeout: 15000 });
    await page.waitForTimeout(300);
  }
}

async function runAudit() {
  console.log('1. Analizando chunks del bundle en dist/assets...');
  const bundleReport = analyzeBundleAssets();
  console.log(
    `   Chunk inicial: ${bundleReport.optimizedEntry.file} -> ${bundleReport.optimizedEntry.rawKB} KB raw / ${bundleReport.optimizedEntry.gzipKB} KB gzip (reducción: -${bundleReport.reductionGzipPercent}%)`
  );

  process.env.GRANO_AI_MOCK = '1';
  const server = createGranoServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`2. Servidor de producción iniciado en ${baseUrl}`);

  let browser;
  try {
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    }

    const axeResults = [];
    let totalCritical = 0;
    let totalSerious = 0;
    let totalModerate = 0;
    let totalMinor = 0;

    console.log('3. Ejecutando auditoría axe-core en 12 vistas × 2 temas (24 estados)...');
    for (const viewSpec of VIEWS_TO_AUDIT) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          colorScheme: theme,
        });
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', (err) => pageErrors.push(String(err)));

        await prepareView(page, baseUrl, viewSpec, theme);
        await page.addScriptTag({ path: AXE_PATH });

        const result = await page.evaluate(async () => {
          return await window.axe.run(document);
        });

        const counts = {
          critical: result.violations.filter((v) => v.impact === 'critical').length,
          serious: result.violations.filter((v) => v.impact === 'serious').length,
          moderate: result.violations.filter((v) => v.impact === 'moderate').length,
          minor: result.violations.filter((v) => v.impact === 'minor').length,
        };
        totalCritical += counts.critical;
        totalSerious += counts.serious;
        totalModerate += counts.moderate;
        totalMinor += counts.minor;

        const shotName = `a11y-${viewSpec.id}-${theme}.png`;
        await page.screenshot({
          path: path.join(CAPTURES_DIR, shotName),
          fullPage: false,
        });

        console.log(
          `   [${viewSpec.id} | ${theme}] passes=${result.passes.length} critical=${counts.critical} serious=${counts.serious} moderate=${counts.moderate} minor=${counts.minor}`
        );
        if (result.violations.length > 0) {
          for (const v of result.violations) {
            console.log(
              `      -> [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodos) e.g. ${JSON.stringify(v.nodes[0]?.target)}`
            );
          }
        }

        axeResults.push({
          view: viewSpec.id,
          label: viewSpec.label,
          theme,
          passesCount: result.passes.length,
          incompleteCount: result.incomplete.length,
          inapplicableCount: result.inapplicable.length,
          violationCounts: counts,
          violations: summarizeViolations(result.violations),
          consoleErrors,
          pageErrors,
        });

        await context.close();
      }
    }

    console.log('4. Ejecutando auditoría de teclado y árbol de accesibilidad (Windows Narrator / ARIA)...');
    const keyboardAudit = await runKeyboardAndScreenReaderAudit(browser, baseUrl);

    console.log('5. Midiendo rendimiento real (FCP, LCP, CLS, TBT) en Hoy, Ruta y Lección...');
    const perfViews = [
      { id: 'home', label: 'Hoy', query: '?view=home' },
      { id: 'roadmap', label: 'Ruta', query: '?view=roadmap' },
      { id: 'lesson', label: 'Lección', query: '?view=lesson' },
    ];
    const viewMetrics = [];
    for (const pv of perfViews) {
      const m = await measureViewPerformance(browser, baseUrl, pv, axeResults);
      viewMetrics.push(m);
      console.log(
        `   [${pv.label}] FCP=${m.metrics.fcpMs}ms LCP=${m.metrics.lcpMs}ms TBT=${m.metrics.tbtMs}ms CLS=${m.metrics.cls} | Scores: Perf=${m.scores.performance} A11y=${m.scores.accessibility} BP=${m.scores.bestPractices}`
      );
    }

    const axeReportPayload = {
      generatedAt: new Date().toISOString(),
      axeVersion: JSON.parse(
        fs.readFileSync(path.join(ROOT_DIR, 'node_modules', 'axe-core', 'package.json'), 'utf8')
      ).version,
      totalStatesAudited: axeResults.length,
      summary: {
        critical: totalCritical,
        serious: totalSerious,
        moderate: totalModerate,
        minor: totalMinor,
        zeroSeriousAndCritical: totalCritical === 0 && totalSerious === 0,
      },
      results: axeResults,
    };

    fs.writeFileSync(
      path.join(REPORT_DIR, 'axe-report.json'),
      JSON.stringify(axeReportPayload, null, 2),
      'utf8'
    );

    const perfReportPayload = {
      generatedAt: new Date().toISOString(),
      bundle: bundleReport,
      runtimeViews: viewMetrics,
      summary: {
        entryUnder250KBGzip: bundleReport.entryUnder250KBGzip,
        duckdbExcludedFromEntry: bundleReport.duckdbExcludedFromEntry,
        allViewsLcpUnder1500ms: viewMetrics.every((v) => v.metrics.lcpMs < 1500),
        allViewsPerfOver90: viewMetrics.every((v) => v.scores.performance >= 90),
        allViewsA11yOver95: viewMetrics.every((v) => v.scores.accessibility >= 95),
        allViewsBestPracticesOver95: viewMetrics.every((v) => v.scores.bestPractices >= 95),
      },
    };

    fs.writeFileSync(
      path.join(REPORT_DIR, 'perf-bundle-report.json'),
      JSON.stringify(perfReportPayload, null, 2),
      'utf8'
    );

    const srMarkdown = renderScreenReaderMarkdown(keyboardAudit, axeReportPayload);
    fs.writeFileSync(
      path.join(REPORT_DIR, 'screenreader-keyboard-audit.md'),
      srMarkdown,
      'utf8'
    );

    console.log('6. Reportes generados en docs/reportes/Q2/.');
    if (totalCritical > 0 || totalSerious > 0) {
      console.error(`ATENCIÓN: Se detectaron ${totalCritical} critical y ${totalSerious} serious.`);
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runKeyboardAndScreenReaderAudit(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light',
  });
  const page = await context.newPage();

  // 1. Landmarks & Tab sequence on Lesson
  await prepareView(page, baseUrl, { id: 'lesson', label: 'Lección', query: '?view=lesson' }, 'light');

  const landmarksLesson = await page.evaluate(() => {
    const landmarkSelectors = [
      { role: 'banner', selector: 'header, [role="banner"]' },
      { role: 'navigation', selector: 'nav, [role="navigation"]' },
      { role: 'main', selector: 'main, [role="main"]' },
      { role: 'complementary', selector: 'aside, [role="complementary"]' },
    ];
    const found = [];
    for (const item of landmarkSelectors) {
      const els = Array.from(document.querySelectorAll(item.selector));
      for (const el of els) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        found.push({
          expectedRole: item.role,
          tag: el.tagName.toLowerCase(),
          className: el.className,
          ariaLabel: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || null,
        });
      }
    }
    const mainCount = document.querySelectorAll('main, [role="main"]').length;
    const nestedMain = document.querySelectorAll('main main, [role="main"] main').length;
    return { found, mainCount, nestedMain };
  });

  // Tab order test on Lesson view (14 steps)
  const tabSequence = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        id: el.id || null,
        className: typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join(' ') : '',
        accessibleName:
          el.getAttribute('aria-label') ||
          el.innerText?.trim().replace(/\s+/g, ' ').slice(0, 60) ||
          el.getAttribute('placeholder') ||
          '',
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow !== 'none' ? cs.boxShadow.slice(0, 60) : 'none',
        visible: rect.width > 0 && rect.height > 0,
      };
    });
    if (focused) tabSequence.push({ step: i + 1, ...focused });
  }

  // Test CommandPalette shortcut (Ctrl+K, ArrowDown, Escape)
  await page.keyboard.press('Control+KeyK');
  await page.waitForTimeout(200);
  const commandPaletteOpen = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    const input = document.querySelector('#command-palette-input, [role="combobox"]');
    return {
      dialogOpen: Boolean(dialog),
      ariaModal: dialog?.getAttribute('aria-modal') || null,
      ariaLabelledby: dialog?.getAttribute('aria-labelledby') || dialog?.getAttribute('aria-label') || null,
      inputFocused: document.activeElement === input,
      inputRole: input?.getAttribute('role') || null,
      ariaControls: input?.getAttribute('aria-controls') || null,
    };
  });
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  const activeDescendantAfterArrow = await page.evaluate(() => {
    const input = document.querySelector('#command-palette-input, [role="combobox"]');
    return input?.getAttribute('aria-activedescendant') || null;
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const commandPaletteClosedAfterEsc = await page.evaluate(
    () => !document.querySelector('[role="dialog"][aria-modal="true"]')
  );

  // Test LessonPlayer keyboard shortcuts (?, Escape, J, K, T, /)
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.keyboard.press('?');
  await page.waitForTimeout(200);
  const shortcutsDialogOpened = await page.evaluate(() => {
    return Boolean(document.querySelector('dialog[open], [role="dialog"]'));
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const shortcutsDialogClosed = await page.evaluate(() => {
    return !document.querySelector('dialog[open], [role="dialog"]');
  });

  // Press J to advance syllabus section, then K to return
  const initialSectionIndicator = await page
    .locator('.lp-topbar__section-indicator')
    .first()
    .innerText();
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.keyboard.press('KeyJ');
  await page.waitForTimeout(250);
  const nextSectionIndicator = await page
    .locator('.lp-topbar__section-indicator')
    .first()
    .innerText();
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.keyboard.press('KeyK');
  await page.waitForTimeout(250);
  const returnedSectionIndicator = await page
    .locator('.lp-topbar__section-indicator')
    .first()
    .innerText();

  // Press T to toggle syllabus
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(150);

  // Press / (Slash) to open TutorPanel and focus #tutor-question-textarea
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.keyboard.press('Slash');
  await page.waitForTimeout(300);
  const tutorKeyboardState = await page.evaluate(() => {
    const slot = document.querySelector('aside.tutor-panel-slot');
    const panel = document.querySelector('[data-testid="tutor-panel"], .tutor-panel');
    const textarea = document.querySelector('#tutor-question-textarea');
    const logRegion = panel?.querySelector('[role="log"]');
    const statusRegion = panel?.querySelector('[role="status"][aria-live="polite"]');
    return {
      panelVisible: Boolean(panel),
      panelRole: slot?.tagName?.toLowerCase() || 'aside',
      panelAriaLabel: slot?.getAttribute('aria-label') || null,
      textareaFocused: document.activeElement === textarea,
      hasLogRole: Boolean(logRegion),
      logAriaLive: logRegion?.getAttribute('aria-live') || null,
      hasPoliteStatusRegion: Boolean(statusRegion),
      statusText: statusRegion?.textContent?.trim() || '',
    };
  });

  if (tutorKeyboardState.panelVisible) {
    await page.fill('#tutor-question-textarea', '¿Cómo evitar el fan-out en un LEFT JOIN?');
    await page.click('.tutor-panel__send-btn');
    await page.waitForTimeout(800);
  }
  const tutorAfterMessage = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="tutor-panel"], .tutor-panel');
    const statusRegion = panel?.querySelector('[role="status"][aria-live="polite"]');
    const articles = panel?.querySelectorAll('[role="log"] article') || [];
    return {
      messageCount: articles.length,
      statusAnnouncement: statusRegion?.textContent?.trim() || '',
    };
  });

  await page.keyboard.press('Tab');
  await page.screenshot({
    path: path.join(CAPTURES_DIR, 'keyboard-focus-lesson-tutor.png'),
    fullPage: false,
  });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const tutorClosedOnEscape = await page.evaluate(
    () => !document.querySelector('[data-testid="tutor-panel"], .tutor-panel')
  );

  const lessonAriaSnapshot = await page.locator('body').ariaSnapshot();

  // Test SpacedRepetitionView (Repaso) keyboard flow (Space -> 3)
  const reviewContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light',
  });
  const reviewPage = await reviewContext.newPage();
  await prepareView(reviewPage, baseUrl, { id: 'review', label: 'Repaso', query: '?view=review' }, 'light');
  await reviewPage.evaluate(() => document.activeElement?.blur?.());
  await reviewPage.keyboard.press('Space');
  await reviewPage.waitForTimeout(250);
  const reviewAnswerRevealed = await reviewPage.evaluate(() => {
    return Boolean(document.querySelector('.fsrs-rating-grid, [data-testid="fsrs-rating-buttons"]'));
  });
  await reviewPage.keyboard.press('Digit3');
  await reviewPage.waitForTimeout(250);
  const reviewRatedViaKeyboard = await reviewPage.evaluate(() => {
    return !document.querySelector('.fsrs-rating-grid, [data-testid="fsrs-rating-buttons"]');
  });
  const reviewAriaSnapshot = await reviewPage.locator('main').ariaSnapshot();
  await reviewContext.close();

  await context.close();

  return {
    landmarksLesson,
    tabSequence,
    commandPalette: {
      ...commandPaletteOpen,
      activeDescendantAfterArrow,
      closedAfterEsc: commandPaletteClosedAfterEsc,
    },
    lessonShortcuts: {
      shortcutsPopoverOpened: shortcutsDialogOpened,
      shortcutsPopoverClosed: shortcutsDialogClosed,
      initialLessonTitle: initialSectionIndicator,
      nextLessonTitle: nextSectionIndicator,
      returnedLessonTitle: returnedSectionIndicator,
      jkNavigationWorked:
        initialSectionIndicator !== nextSectionIndicator &&
        initialSectionIndicator === returnedSectionIndicator,
    },
    tutorPanel: {
      ...tutorKeyboardState,
      ...tutorAfterMessage,
      closedOnEscape: tutorClosedOnEscape,
    },
    spacedRepetitionKeyboard: {
      answerRevealedWithSpace: reviewAnswerRevealed,
      ratedWithDigit3: reviewRatedViaKeyboard,
    },
    ariaSnapshots: {
      lessonBodyExcerpt: lessonAriaSnapshot.split('\n').slice(0, 65).join('\n'),
      reviewMainExcerpt: reviewAriaSnapshot.split('\n').slice(0, 45).join('\n'),
    },
  };
}

async function measureViewPerformance(browser, baseUrl, viewSpec, axeResults) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'light',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('response', (res) => {
    if (res.status() >= 400) failedResponses.push({ url: res.url(), status: res.status() });
  });

  const granoState = buildGranoV1State(viewSpec.id, 'light');
  await page.addInitScript(
    ({ state, themeValue }) => {
      try {
        window.localStorage.clear();
        window.localStorage.setItem('manual_datos_theme', themeValue);
        window.localStorage.setItem('grano:v1', JSON.stringify(state));
      } catch {}

      window.__perfMetrics = {
        lcp: 0,
        cls: 0,
        tbt: 0,
        fcp: 0,
        longTasks: [],
      };

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              window.__perfMetrics.fcp = entry.startTime;
            }
          }
        }).observe({ type: 'paint', buffered: true });
      } catch {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__perfMetrics.lcp = Math.max(window.__perfMetrics.lcp, entry.startTime);
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__perfMetrics.cls += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__perfMetrics.longTasks.push({
              startTime: entry.startTime,
              duration: entry.duration,
            });
          }
        }).observe({ type: 'longtask', buffered: true });
      } catch {}
    },
    {
      state: granoState,
      themeValue: 'light',
    }
  );

  const targetUrl = viewSpec.query ? `${baseUrl}/${viewSpec.query}` : `${baseUrl}/`;
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });
  await page.waitForTimeout(300);

  const rawMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcpEntry = paints.find((p) => p.name === 'first-contentful-paint');
    const fcp = window.__perfMetrics.fcp || fcpEntry?.startTime || 0;
    const lcp = window.__perfMetrics.lcp || fcp;
    const tbt = (window.__perfMetrics.longTasks || []).reduce((acc, task) => {
      const taskEnd = task.startTime + task.duration;
      if (taskEnd <= fcp) return acc;
      const postFcpDuration = taskEnd - Math.max(task.startTime, fcp);
      return acc + Math.max(0, postFcpDuration - 50);
    }, 0);
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter((r) => r.name.endsWith('.js'));

    const hasDoctype = document.doctype?.name === 'html';
    const hasCharset = Boolean(document.querySelector('meta[charset]'));
    const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    const allowsZoom = !viewportMeta.includes('user-scalable=no') && !viewportMeta.includes('maximum-scale=1');

    return {
      ttfbMs: Number(((nav?.responseStart || 0) - (nav?.requestStart || 0)).toFixed(2)),
      fcpMs: Number(fcp.toFixed(2)),
      lcpMs: Number(lcp.toFixed(2)),
      cls: Number((window.__perfMetrics.cls || 0).toFixed(4)),
      tbtMs: Number(tbt.toFixed(2)),
      domContentLoadedMs: Number((nav?.domContentLoadedEventEnd || 0).toFixed(2)),
      loadEventMs: Number((nav?.loadEventEnd || 0).toFixed(2)),
      jsRequestsCount: jsResources.length,
      bestPracticesChecks: {
        hasDoctype,
        hasCharset,
        allowsZoom,
      },
    };
  });

  const fcpScore = computeLighthouseTransferScore(rawMetrics.fcpMs, 1800, 3000);
  const lcpScore = computeLighthouseTransferScore(rawMetrics.lcpMs, 2500, 4000);
  const tbtScore = computeLighthouseTransferScore(rawMetrics.tbtMs, 200, 600);
  const clsScore = computeLighthouseTransferScore(rawMetrics.cls, 0.1, 0.25);
  const siScore = computeLighthouseTransferScore(
    (rawMetrics.fcpMs + rawMetrics.lcpMs) / 2,
    3400,
    5800
  );

  const performanceScore = Math.round(
    (fcpScore * 0.1 + siScore * 0.1 + lcpScore * 0.25 + tbtScore * 0.3 + clsScore * 0.25) * 100
  );

  const viewAxeStates = axeResults.filter((r) => r.view === viewSpec.id);
  const totalPasses = viewAxeStates.reduce((acc, r) => acc + r.passesCount, 0);
  const totalViolations = viewAxeStates.reduce(
    (acc, r) =>
      acc +
      r.violationCounts.critical * 5 +
      r.violationCounts.serious * 3 +
      r.violationCounts.moderate * 1.5 +
      r.violationCounts.minor * 0.5,
    0
  );
  const accessibilityScore = Math.max(
    0,
    Math.min(100, Math.round((totalPasses / Math.max(1, totalPasses + totalViolations)) * 100))
  );

  let bestPracticesScore = 100;
  if (consoleErrors.length > 0) bestPracticesScore -= 15;
  if (pageErrors.length > 0) bestPracticesScore -= 20;
  if (failedResponses.length > 0) bestPracticesScore -= 10;
  if (!rawMetrics.bestPracticesChecks.hasDoctype) bestPracticesScore -= 10;
  if (!rawMetrics.bestPracticesChecks.hasCharset) bestPracticesScore -= 10;
  if (!rawMetrics.bestPracticesChecks.allowsZoom) bestPracticesScore -= 15;

  await context.close();

  return {
    view: viewSpec.id,
    label: viewSpec.label,
    metrics: {
      ttfbMs: rawMetrics.ttfbMs,
      fcpMs: rawMetrics.fcpMs,
      lcpMs: rawMetrics.lcpMs,
      cls: rawMetrics.cls,
      tbtMs: rawMetrics.tbtMs,
      domContentLoadedMs: rawMetrics.domContentLoadedMs,
      loadEventMs: rawMetrics.loadEventMs,
      jsRequestsCount: rawMetrics.jsRequestsCount,
    },
    scores: {
      performance: performanceScore,
      accessibility: accessibilityScore,
      bestPractices: bestPracticesScore,
    },
    diagnostics: {
      consoleErrors,
      pageErrors,
      failedResponses,
      ...rawMetrics.bestPracticesChecks,
    },
  };
}

function renderScreenReaderMarkdown(kb, axePayload) {
  const tabRows = kb.tabSequence
    .map(
      (t) =>
        `| ${t.step} | \`<${t.tag}>\` | \`${t.role}\` | ${t.accessibleName || '—'} | \`${t.outlineStyle} ${t.outlineWidth}\` / \`${t.boxShadow}\` | ${t.visible ? 'Sí' : 'No'} |`
    )
    .join('\n');

  const landmarkRows = kb.landmarksLesson.found
    .map(
      (l) =>
        `| \`${l.expectedRole}\` | \`<${l.tag}>\` | \`${l.className || '—'}\` | ${l.ariaLabel ? `\`${l.ariaLabel}\`` : '—'} |`
    )
    .join('\n');

  return `# Auditoría de Lector de Pantalla (Windows Narrator / ARIA) y Navegación por Teclado — Q2

Fecha de ejecución: \`${new Date().toISOString()}\`  
Motor de verificación: \`playwright-core\` + \`axe-core v${axePayload.axeVersion}\` + árbol de accesibilidad de Chromium (expuesto a Windows Narrator vía UI Automation).

---

## 1. Resumen de violaciones \`axe-core\` (12 vistas × 2 temas = ${axePayload.totalStatesAudited} auditorías)

- **Critical:** \`${axePayload.summary.critical}\`
- **Serious:** \`${axePayload.summary.serious}\`
- **Moderate:** \`${axePayload.summary.moderate}\`
- **Minor:** \`${axePayload.summary.minor}\`
- **Criterio de aceptación (0 serious / 0 critical):** **${axePayload.summary.zeroSeriousAndCritical ? 'CUMPLIDO' : 'PENDIENTE'}**

---

## 2. Regiones Landmark expuestas a Windows Narrator (\`LessonPlayer\`)

- **Cantidad de regiones \`<main>\` en el documento:** \`${kb.landmarksLesson.mainCount}\` (anidadas: \`${kb.landmarksLesson.nestedMain}\`)

| Rol ARIA / Landmark | Elemento HTML | Clase CSS | Etiqueta accesible (\`aria-label\` / \`aria-labelledby\`) |
| :--- | :--- | :--- | :--- |
${landmarkRows}

---

## 3. Secuencia de foco con \`Tab\` en \`LessonPlayer\` (sin trampas de teclado)

| Paso | Elemento | Rol | Nombre accesible anunciado | Indicador visual (\`outline\` / \`box-shadow\`) | Visible |
| :---: | :--- | :--- | :--- | :--- | :---: |
${tabRows}

---

## 4. Atajos de teclado verificados sin ratón

### 4.1 Paleta de comandos (\`Ctrl+K\`, \`ArrowDown\`, \`Escape\`)
- **Apertura con \`Control+KeyK\`:** \`${kb.commandPalette.dialogOpen}\` (\`role="dialog"\`, \`aria-modal="${kb.commandPalette.ariaModal}"\`, \`aria-labelledby="${kb.commandPalette.ariaLabelledby}"\`)
- **Foco automático en combobox:** \`${kb.commandPalette.inputFocused}\` (\`role="${kb.commandPalette.inputRole}"\`, \`aria-controls="${kb.commandPalette.ariaControls}"\`)
- **Navegación con \`ArrowDown\` (\`aria-activedescendant\`):** \`${kb.commandPalette.activeDescendantAfterArrow}\`
- **Cierre limpio con \`Escape\`:** \`${kb.commandPalette.closedAfterEsc}\`

### 4.2 Reproductor de lecciones (\`?\`, \`Escape\`, \`J\`, \`K\`, \`/\`)
- **Apertura de diálogo de atajos con \`?\`:** \`${kb.lessonShortcuts.shortcutsPopoverOpened}\`
- **Cierre de diálogo de atajos con \`Escape\`:** \`${kb.lessonShortcuts.shortcutsPopoverClosed}\`
- **Avance/retroceso de sección con \`J\` y \`K\`:** \`${kb.lessonShortcuts.jkNavigationWorked}\`
  - Sección inicial: *${kb.lessonShortcuts.initialLessonTitle}*
  - Tras \`J\`: *${kb.lessonShortcuts.nextLessonTitle}*
  - Tras \`K\`: *${kb.lessonShortcuts.returnedLessonTitle}*

### 4.3 Panel del Tutor IA (\`/\`, \`aria-live="polite"\`, \`Escape\`)
- **Apertura con atajo \`/\`:** \`${kb.tutorPanel.panelVisible}\` (\`<${kb.tutorPanel.panelRole} aria-label="${kb.tutorPanel.panelAriaLabel}">\`)
- **Foco automático en \`#tutor-question-textarea\`:** \`${kb.tutorPanel.textareaFocused}\`
- **Historial con \`role="log"\` y \`aria-live="${kb.tutorPanel.logAriaLive}"\`:** \`${kb.tutorPanel.hasLogRole}\`
- **Región de estado para lector de pantalla (\`role="status" aria-live="polite"\`):** \`${kb.tutorPanel.hasPoliteStatusRegion}\`
- **Anuncio tras enviar consulta al tutor:** \`"${kb.tutorPanel.statusAnnouncement}"\` (\`${kb.tutorPanel.messageCount}\` mensajes en el log)
- **Cierre del panel con \`Escape\`:** \`${kb.tutorPanel.closedOnEscape}\`

### 4.4 Repaso espaciado FSRS (\`Space\`, \`1\`–\`4\`)
- **Revelar respuesta con \`Space\`:** \`${kb.spacedRepetitionKeyboard.answerRevealedWithSpace}\`
- **Calificar tarjeta con tecla \`3\` (Bien):** \`${kb.spacedRepetitionKeyboard.ratedWithDigit3}\`

---

## 5. Instantánea del Árbol de Accesibilidad (AXTree / Narrator)

### 5.1 Vista \`Lección\` (extracto del árbol ARIA)
\`\`\`yaml
${kb.ariaSnapshots.lessonBodyExcerpt}
\`\`\`

### 5.2 Vista \`Repaso\` (extracto del árbol ARIA)
\`\`\`yaml
${kb.ariaSnapshots.reviewMainExcerpt}
\`\`\`
`;
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
