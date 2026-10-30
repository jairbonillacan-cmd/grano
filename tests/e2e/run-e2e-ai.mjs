import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const SHOTS_DIR = path.join(ROOT_DIR, 'docs', 'reportes', 'capturas', 'Q1');

fs.mkdirSync(SHOTS_DIR, { recursive: true });

function findFreePort(preferred = 5182) {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.on('error', reject);
      fallback.listen(0, '127.0.0.1', () => {
        const { port } = fallback.address();
        fallback.close(() => resolve(port));
      });
    });
    srv.listen(preferred, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`El servidor Vite no respondió en ${url} tras ${timeoutMs}ms`);
}

function startViteServerRealAi(port) {
  const viteBin = path.join(ROOT_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const env = { ...process.env };
  delete env.GRANO_AI_MOCK;

  return spawn(
    process.execPath,
    [viteBin, '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd: ROOT_DIR,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
}

async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ headless: true, channel });
    } catch {
      // try next
    }
  }
  return chromium.launch({ headless: true });
}

async function main() {
  const port = await findFreePort(Number(process.env.GRANO_E2E_AI_PORT || 5182));
  const BASE_URL = `http://127.0.0.1:${port}`;
  console.log(`\n=== Grano E2E AI Real (agy sin GRANO_AI_MOCK) en ${BASE_URL} ===`);
  const viteProc = startViteServerRealAi(port);
  let browser = null;
  const t0 = Date.now();

  try {
    await waitForServer(BASE_URL);

    // Verificar primero /api/ai/status directamente
    const statusRes = await fetch(`${BASE_URL}/api/ai/status`);
    const statusJson = await statusRes.json();
    if (!statusJson.available || statusJson.engine !== 'agy') {
      throw new Error(`El puente IA real (agy) no está disponible: ${JSON.stringify(statusJson)}`);
    }
    console.log(
      `  [INFO] /api/ai/status -> engine=${statusJson.engine}, defaultModel=${statusJson.defaultModel}`
    );

    browser = await launchBrowser();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/?view=lesson&lesson=c1-sql-joins-02-grano-fanout`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('.lesson-player', { timeout: 10000 });

    // Abrir el panel del Tutor
    await page.click('button.app-topbar__ask-btn');
    await page.waitForSelector('[data-testid="tutor-panel"]', { timeout: 5000 });

    // Seleccionar el modo rápido (Flash) en el selector segmentado del Tutor
    await page.locator('.tutor-model-segmented__btn', { hasText: 'Rápido' }).click();

    const question =
      'En una sola frase corta: ¿por qué ocurre el fan-out al unir orders con order_items?';
    await page.fill('#tutor-question-textarea', question);
    await page.click('.tutor-panel__send-btn');

    // Esperar a que termine el streaming y aparezca el artículo final con métricas (total X.X s)
    await page.waitForFunction(
      () => {
        const msgs = Array.from(document.querySelectorAll('[data-testid="tutor-msg-assistant"]'));
        if (msgs.length === 0) return false;
        const last = msgs[msgs.length - 1];
        const meta = last.querySelector('.tutor-msg-assistant__meta');
        return Boolean(meta && meta.textContent.includes('total'));
      },
      { timeout: 75000 }
    );

    const assistantData = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('[data-testid="tutor-msg-assistant"]'));
      const last = msgs[msgs.length - 1];
      return {
        text: last?.querySelector('.tutor-msg-assistant__body')?.innerText.trim() || '',
        metrics: last?.querySelector('.tutor-msg-assistant__meta')?.innerText.trim() || '',
      };
    });

    if (assistantData.text.includes('[MOCK]')) {
      throw new Error(`Se recibió respuesta [MOCK] en lugar de agy real: ${assistantData.text}`);
    }
    if (assistantData.text.length < 20) {
      throw new Error(`Respuesta de agy demasiado corta: ${assistantData.text}`);
    }

    await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_e2e_ai_real_agy.png') });
    const elapsed = Date.now() - t0;
    console.log(
      `  [PASS] Flujo IA real (agy): respuesta recibida (${assistantData.text.length} chars) [${assistantData.metrics.replace(/\s+/g, ' ')}] en ${elapsed} ms`
    );

    await context.close();
  } finally {
    if (browser) await browser.close();
    viteProc.kill();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('  [FAIL] Error en run-e2e-ai.mjs:', err);
  process.exit(1);
});
