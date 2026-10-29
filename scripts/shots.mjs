// Captura las vistas principales en varias resoluciones y temas.
// Uso: node scripts/shots.mjs [--out docs/reportes/capturas/F0-antes] [--url http://127.0.0.1:5174]
//      [--sizes 1280x720,390x844] [--themes light,dark] [--views home,roadmap,lesson,tutor]
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
const SIZES = (args.sizes || '1280x720,1440x900,390x844').split(',').map((s) => {
  const [width, height] = s.split('x').map(Number);
  return { width, height, label: s };
});
const THEMES = (args.themes || 'light,dark').split(',');
const ALL_VIEWS = ['home', 'roadmap', 'lesson', 'simulator', 'tutor', 'review', 'projects', 'glossary', 'progress'];
const VIEWS = args.views ? args.views.split(',') : ALL_VIEWS;

// Vistas a las que se llega por la navegación lateral (o "Más" en móvil).
const NAV_LABELS = { roadmap: 'Ruta', review: 'Repaso', projects: 'Proyectos', glossary: 'Glosario', progress: 'Mi progreso' };

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch {}
  }
  throw new Error('No encuentro Edge ni Chrome instalados.');
}

// Los botones pueden llevar contadores ("Repaso 1"), así que se busca por prefijo.
const byPrefix = (name) => new RegExp('^\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

async function clickByName(page, name) {
  const target = page.getByRole('button', { name: byPrefix(name) }).first();
  if (await target.isVisible().catch(() => false)) {
    await target.click();
    return true;
  }
  const more = page.getByRole('button', { name: 'Más' }).first();
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.waitForTimeout(300);
    const inMenu = page.getByRole('button', { name: byPrefix(name) }).or(page.getByRole('link', { name: byPrefix(name) })).first();
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
      const toggle = page.getByRole('button', { name: 'Alternar panel de Tutor IA' }).first();
      if (!(await toggle.isVisible().catch(() => false))) return false;
      await toggle.click();
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
    // Estado limpio y tema fijo en cada contexto.
    await context.addInitScript((t) => {
      try {
        if (!sessionStorage.getItem('shots-init')) {
          localStorage.clear();
          sessionStorage.setItem('shots-init', '1');
        }
        localStorage.setItem('manual_datos_theme', t);
      } catch {}
    }, theme);
    const page = await context.newPage();
    for (const view of VIEWS) {
      const ok = await openView(page, view).catch(() => false);
      if (!ok) {
        missing.push(`${view} ${size.label} ${theme}`);
        continue;
      }
      await page.waitForTimeout(600);
      const file = path.join(OUT, `${view}_${size.label}_${theme}.png`);
      await page.screenshot({ path: file, fullPage: false });
      saved += 1;
    }
    await context.close();
  }
}

await browser.close();
console.log(`Capturas guardadas: ${saved} en ${OUT}`);
if (missing.length) console.log(`No se pudieron abrir (${missing.length}): ${missing.join(' | ')}`);
