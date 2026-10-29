// Captura las vistas principales en varias resoluciones, temas, densidades y escalas.
// Uso: node scripts/shots.mjs [--out docs/reportes/capturas/T7] [--url http://127.0.0.1:5174]
//      [--sizes 1920x1080,1440x900,1280x800,1280x720,390x844] [--themes light,dark]
//      [--views home,roadmap,lesson,simulator,tutor,practice,review,projects,glossary,progress,settings]
//      [--density auto|comfortable|compact] [--scale 1|0.9|1.1|1.25] [--prefix T7_]
// Requiere el dev server encendido y Edge o Chrome instalados (playwright-core no trae navegador).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, [])
);

const OUT = args.out || 'docs/reportes/capturas/F0-antes';
const BASE = args.url || 'http://127.0.0.1:5174';
const PREFIX = args.prefix || '';
const DENSITY = args.density || '';
const SCALE = args.scale ? Number(args.scale) : null;
const SIZES = (args.sizes || '1280x720,1440x900,390x844').split(',').map((s) => {
  const [width, height] = s.split('x').map(Number);
  return { width, height, label: s };
});
const THEMES = (args.themes || 'light,dark').split(',');
const ALL_VIEWS = [
  'home',
  'roadmap',
  'lesson',
  'simulator',
  'tutor',
  'practice',
  'review',
  'projects',
  'glossary',
  'progress',
  'settings',
];
const VIEWS = args.views ? args.views.split(',') : ALL_VIEWS;

// Vistas a las que se llega por la navegación lateral, menú de usuario o "Más" en móvil.
const NAV_LABELS = {
  roadmap: 'Ruta',
  practice: 'Práctica',
  review: 'Repaso',
  projects: 'Proyectos',
  glossary: 'Glosario',
  progress: 'Progreso',
  settings: 'Ajustes',
};

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch {}
  }
  throw new Error('No encuentro Edge ni Chrome instalados.');
}

// Los botones pueden llevar contadores ("Repaso (1 pendientes)"), así que se busca por prefijo.
const byPrefix = (name) => new RegExp('^\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

async function clickByName(page, name) {
  const target = page.getByRole('button', { name: byPrefix(name) }).first();
  if (await target.isVisible().catch(() => false)) {
    await target.click();
    return true;
  }

  // En móvil: buscar dentro de la hoja "Más"
  const more = page.getByRole('button', { name: 'Más' }).first();
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.waitForTimeout(250);
    const inSheet = page
      .getByRole('button', { name: byPrefix(name) })
      .or(page.getByRole('link', { name: byPrefix(name) }))
      .first();
    if (await inSheet.isVisible().catch(() => false)) {
      await inSheet.click();
      return true;
    }
  }

  // En escritorio: buscar dentro del menú de usuario (p. ej. "Proyectos" o "Ajustes")
  const userMenu = page.getByRole('button', { name: /Menú de usuario/i }).first();
  if (await userMenu.isVisible().catch(() => false)) {
    await userMenu.click();
    await page.waitForTimeout(200);
    const inMenu = page.getByRole('menuitem', { name: byPrefix(name) }).first();
    if (await inMenu.isVisible().catch(() => false)) {
      await inMenu.click();
      return true;
    }
  }

  return false;
}

async function openView(page, view) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (view === 'home') return true;
  if (view === 'ui') {
    await page.goto(`${BASE}/?ui=1`, { waitUntil: 'networkidle' });
    return true;
  }
  if (NAV_LABELS[view]) return clickByName(page, NAV_LABELS[view]);
  if (view === 'lesson' || view === 'simulator' || view === 'tutor') {
    const cont = page.getByText('Continuar', { exact: true }).first();
    if (!(await cont.isVisible().catch(() => false))) return false;
    await cont.click();
    await page.waitForTimeout(400);
    if (view === 'simulator') {
      return clickByName(page, 'Paso 2: Simulador');
    }
    if (view === 'tutor') {
      const askBtn = page
        .getByRole('button', { name: /Preguntar|Alternar panel de Tutor IA/i })
        .first();
      if (!(await askBtn.isVisible().catch(() => false))) return false;
      await askBtn.click();
    }
    return true;
  }
  return false;
}

const browser = await launch();
fs.mkdirSync(OUT, { recursive: true });
const missing = [];
let saved = 0;

for (const size of SIZES) {
  for (const theme of THEMES) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });
    await context.addInitScript(
      ({ t, density, scale }) => {
        try {
          if (!sessionStorage.getItem('shots-init')) {
            localStorage.clear();
            sessionStorage.setItem('shots-init', '1');
          }
          localStorage.setItem('manual_datos_theme', t);
          const raw = localStorage.getItem('grano:v1');
          const parsed = raw ? JSON.parse(raw) : null;
          const nextState = parsed && typeof parsed === 'object' ? parsed : {
            version: 1,
            profile: { track: null, startLevel: 0, onboarded: false, createdAt: new Date().toISOString() },
            prefs: {
              theme: t,
              density: density || 'auto',
              scale: scale || 1,
              aiModelFast: 'gemini-3.8-flash-low',
              aiModelDeep: 'gemini-4-argon-medium',
              aiEnabled: true,
              reducedMotion: 'system',
              sidebarCollapsed: false,
            },
            progress: { lessons: {}, projects: {}, diagnostic: null, studyMinutesByDay: {} },
            review: { cards: {} },
            tutor: { threads: {} },
          };
          nextState.prefs = {
            ...nextState.prefs,
            theme: t,
            ...(density ? { density } : {}),
            ...(scale ? { scale } : {}),
          };
          localStorage.setItem('grano:v1', JSON.stringify(nextState));
        } catch {}
      },
      { t: theme, density: DENSITY, scale: SCALE }
    );
    const page = await context.newPage();
    for (const view of VIEWS) {
      const ok = await openView(page, view).catch(() => false);
      if (!ok) {
        missing.push(`${view} ${size.label} ${theme}`);
        continue;
      }
      await page.waitForTimeout(500);
      const suffix = DENSITY ? `_${DENSITY}` : '';
      const scaleSuffix = SCALE && SCALE !== 1 ? `_scale${Math.round(SCALE * 100)}` : '';
      const file = path.join(
        OUT,
        `${PREFIX}${view}_${size.label}_${theme}${suffix}${scaleSuffix}.png`
      );
      await page.screenshot({ path: file, fullPage: false });
      saved += 1;
    }
    await context.close();
  }
}

await browser.close();
console.log(`Capturas guardadas: ${saved} en ${OUT}`);
if (missing.length) {
  console.log(`No se pudieron abrir (${missing.length}): ${missing.join(' | ')}`);
}
