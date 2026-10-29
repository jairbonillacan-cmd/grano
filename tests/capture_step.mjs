import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5174/';
const OUT_DIR = path.resolve('tests/screenshots');

fs.mkdirSync(OUT_DIR, { recursive: true });

const mode = process.argv[2] || 'step1';

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
});

try {
  if (mode === 'step1') {
    const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT_DIR, 'step1_portada.png') });
    const firstChapter = page.locator('.syllabus-chapter-row').first();
    if ((await firstChapter.count()) > 0) {
      await firstChapter.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: path.join(OUT_DIR, 'step1_capitulo1.png') });
    await page.close();
  } else if (mode === 'step2-header') {
    for (const width of [1366, 1024, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(OUT_DIR, `step2_header_${width}.png`),
        clip: { x: 0, y: 0, width, height: 140 },
      });
      await page.close();
    }
  } else if (mode === 'step3-portada') {
    const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT_DIR, 'step3_portada.png'), fullPage: true });
    await page.close();
  } else if (mode === 'step4-chapters') {
    const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
    for (const chIndex of [0, 6, 13]) {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const rows = page.locator('.syllabus-chapter-row');
      if ((await rows.count()) > chIndex) {
        await rows.nth(chIndex).click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        await page.screenshot({
          path: path.join(OUT_DIR, `step4_capitulo_${chIndex + 1}.png`),
          fullPage: true,
        });
      }
    }
    await page.close();
  } else if (mode === 'step6-views') {
    const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const views = [
      { label: 'Glosario', file: 'step6_glosario.png' },
      { label: 'Repaso', file: 'step6_repaso.png' },
      { label: 'Proyectos', file: 'step6_proyectos.png' },
      { label: 'Analítica', file: 'step6_analitica.png' },
    ];
    for (const v of views) {
      await page.locator('.header-link', { hasText: v.label }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT_DIR, v.file), fullPage: true });
    }
    await page.close();
  }
  console.log(`Captured ${mode} successfully in ${OUT_DIR}`);
} finally {
  await browser.close();
}
