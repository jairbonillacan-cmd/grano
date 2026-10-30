import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const SHOTS_DIR = path.join(ROOT_DIR, 'docs', 'reportes', 'capturas', 'Q1');
const FIXTURE_PATH = path.join(ROOT_DIR, 'tests', 'fixtures', 'progress.json');

fs.mkdirSync(SHOTS_DIR, { recursive: true });

function findFreePort(preferred = 5181) {
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

function startViteServer(port) {
  const viteBin = path.join(ROOT_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const env = { ...process.env, GRANO_AI_MOCK: '1' };
  delete env.GRANO_AGY_PATH;

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

async function runFlow(results, id, name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - t0;
    results.push({ id, name, status: 'PASS', ms, detail: detail || 'OK' });
    console.log(`  [PASS] Flujo ${id}: ${name} (${ms} ms) — ${detail || 'OK'}`);
  } catch (err) {
    const ms = Date.now() - t0;
    results.push({ id, name, status: 'FAIL', ms, detail: err.message });
    console.error(`  [FAIL] Flujo ${id}: ${name} (${ms} ms)\n    -> ${err.message}`);
  }
}

async function main() {
  const port = await findFreePort(Number(process.env.GRANO_E2E_PORT || 5181));
  const BASE_URL = `http://127.0.0.1:${port}`;
  console.log(`\n=== Grano E2E Suite (GRANO_AI_MOCK=1) en ${BASE_URL} ===`);
  const viteProc = startViteServer(port);
  let browser = null;
  const results = [];

  try {
    await waitForServer(BASE_URL);
    browser = await launchBrowser();

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    const page = await context.newPage();

    // -------------------------------------------------------------------------
    // Flujo 1: Onboarding → elige BI → nivel 0 → ve la Ruta con el tronco común primero
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      1,
      'Onboarding → elige BI → nivel 0 → ve la Ruta con el tronco común primero',
      async () => {
        await page.goto(`${BASE_URL}/?view=onboarding`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => window.localStorage.clear());
        await page.goto(`${BASE_URL}/?view=onboarding`, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('.onboarding-view[data-onboarding-step="1"]', { timeout: 10000 });
        await page.click('.onboarding-card[data-track="bi"]');

        await page.waitForSelector('.onboarding-view[data-onboarding-step="2"]', { timeout: 5000 });
        await page
          .locator('.onboarding-levels-list .onboarding-card', {
            hasText: 'Desde cero (nivel 0)',
          })
          .click();

        await page.waitForSelector('.onboarding-view[data-onboarding-step="3"]', { timeout: 5000 });
        const summaryText = await page.locator('.onboarding-summary-card').innerText();
        if (!summaryText.includes('Tronco común') || !summaryText.includes('Business Intelligence')) {
          throw new Error(`Resumen de onboarding inesperado: ${summaryText}`);
        }
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo01_onboarding_resumen.png') });

        await page.locator('.onboarding-footer button', { hasText: 'Empezar' }).click();
        await page.locator('.app-sidebar__item', { hasText: 'Ruta' }).click();
        await page.waitForSelector('.roadmap-view[data-active-area="bi"]', { timeout: 8000 });

        const firstModuleId = await page
          .locator('.roadmap-module')
          .first()
          .getAttribute('data-module-id');
        const firstModuleTrack = await page
          .locator('.roadmap-module .roadmap-area-dot')
          .first()
          .getAttribute('data-track');

        if (firstModuleId !== 'c0-datos' || firstModuleTrack !== 'core') {
          throw new Error(
            `El primer módulo no es tronco común c0-datos: id=${firstModuleId}, track=${firstModuleTrack}`
          );
        }

        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo01_ruta_bi_tronco_comun.png') });
        return `Ruta BI activa; primer módulo=${firstModuleId} (track=${firstModuleTrack})`;
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 2: Abre la primera lección → recorre secciones → responde un check mal → ve feedback → responde bien
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      2,
      'Abre la primera lección → recorre secciones → responde un check mal → ve feedback específico → responde bien',
      async () => {
        const firstMod = page.locator('.roadmap-module[data-module-id="c0-datos"]');
        const isExpanded = await firstMod.evaluate((el) => el.classList.contains('is-expanded'));
        if (!isExpanded) {
          await firstMod.locator('.roadmap-module__row').click();
        }
        await firstMod.locator('.roadmap-lesson-row.is-existing').first().click();
        await page.waitForSelector('.lesson-player', { timeout: 10000 });

        const lessonTitle = await page.locator('.lp-title').innerText();
        const sectionsCount = await page.locator('.lp-section').count();
        if (sectionsCount < 2) {
          throw new Error(
            `Se esperaban >= 2 secciones en la primera lección, encontradas: ${sectionsCount}`
          );
        }

        // Recorrer las secciones haciendo scroll hasta comprobaciones
        const checksSection = page.locator('#sec-comprobaciones');
        await checksSection.scrollIntoViewIfNeeded();

        const firstCheck = page.locator('.lp-check-card').first();
        await firstCheck.scrollIntoViewIfNeeded();

        // Responder mal primero (opción 2 / índice 1)
        const options = firstCheck.locator('.lp-check-card__options .ui-answer');
        await options.nth(1).click();

        await page.waitForSelector('.lp-check-card.is-incorrect .lp-check-feedback.is-bad', {
          timeout: 5000,
        });
        const badFeedback = await firstCheck.locator('.lp-check-feedback.is-bad').innerText();
        if (!badFeedback.includes('Por qué ocurre este resultado:')) {
          throw new Error(`Feedback de error incompleto: ${badFeedback}`);
        }
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo02_check_incorrecto.png') });

        // Ahora responder bien (opción 1 / índice 0)
        await options.nth(0).click();
        await page.waitForSelector('.lp-check-card.is-correct .lp-check-feedback.is-ok', {
          timeout: 5000,
        });
        const goodFeedback = await firstCheck.locator('.lp-check-feedback.is-ok').innerText();
        if (!goodFeedback.includes('Razonamiento verificado:')) {
          throw new Error(`Feedback de acierto incompleto: ${goodFeedback}`);
        }
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo02_check_correcto.png') });

        return `Lección "${lessonTitle}" (${sectionsCount} secciones): check incorrecto → feedback → correcto verificado`;
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 3: Práctica SQL: escribe consulta incorrecta → ve diferencias → escribe consulta correcta → aprobada
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      3,
      'Práctica SQL: escribe consulta incorrecta → ve diferencias → escribe consulta correcta → aprobada',
      async () => {
        const sqlLab = page.locator('[data-testid="sql-lab"]');
        await sqlLab.scrollIntoViewIfNeeded();

        // Esperar a que DuckDB-WASM esté listo
        await page.waitForFunction(
          () => {
            const el = document.querySelector('[data-testid="sql-engine-status"]');
            return el && el.textContent.includes('Motor SQL listo');
          },
          { timeout: 25000 }
        );

        // Escribir consulta incorrecta en CodeMirror
        const cmContent = sqlLab.locator('.cm-content[contenteditable="true"]');
        await cmContent.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.insertText('SELECT product_id, list_price_usd FROM products LIMIT 2;');

        await page.click('[data-testid="sql-grade-btn"]');
        await page.waitForSelector('[data-testid="sql-grade-box"].is-fail', { timeout: 10000 });
        const failText = await page.locator('[data-testid="sql-grade-box"]').innerText();
        if (!failText.includes('no coincide con la referencia')) {
          throw new Error(`Mensaje de fallo SQL inesperado: ${failText}`);
        }
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo03_sql_incorrecto.png') });

        // Abrir solución, copiar al editor y comprobar resultado correcto
        await page.click('[data-testid="sql-solution-btn"]');
        await sqlLab.locator('button', { hasText: 'Copiar al editor' }).click();
        await page.click('[data-testid="sql-grade-btn"]');

        await page.waitForSelector('[data-testid="sql-grade-box"].is-pass', { timeout: 10000 });
        const passText = await page.locator('[data-testid="sql-grade-box"]').innerText();
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo03_sql_aprobado.png') });

        return `SQL reprobado con diferencias visibles → solución ejecutada → "${passText.split('\n')[0]}"`;
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 4: Tutor con GRANO_AI_MOCK=1: pregunta → ve [MOCK] en streaming → cancela una segunda pregunta a mitad
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      4,
      'Tutor con GRANO_AI_MOCK=1: pregunta → ve [MOCK] en streaming → cancela una segunda pregunta a mitad',
      async () => {
        const panelVisible = await page.locator('[data-testid="tutor-panel"]').isVisible();
        if (!panelVisible) {
          await page.click('button.app-topbar__ask-btn');
        }
        await page.waitForSelector('[data-testid="tutor-panel"]', { timeout: 5000 });

        const textarea = page.locator('#tutor-question-textarea');
        await textarea.fill('¿Por qué es peligroso guardar importes monetarios en DOUBLE?');
        await page.click('.tutor-panel__send-btn');

        await page.waitForFunction(
          () => {
            const msgs = Array.from(document.querySelectorAll('[data-testid="tutor-msg-assistant"]'));
            return msgs.some((m) => m.textContent.includes('[MOCK]'));
          },
          { timeout: 10000 }
        );
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo04_tutor_mock_respuesta.png') });

        // Interceptar la segunda pregunta con respuesta SSE lenta para cancelar a mitad
        await page.route('**/api/ai/chat', async (route) => {
          await new Promise((r) => setTimeout(r, 4000));
          try {
            await route.abort('aborted');
          } catch {
            // La petición ya fue abortada por el cliente o desregistrada
          }
        });

        try {
          await textarea.fill('Segunda consulta para probar cancelación a mitad del streaming');
          await page.click('.tutor-panel__send-btn');

          const stopBtn = page.locator('[data-testid="tutor-stop-btn"]');
          await stopBtn.waitFor({ state: 'visible', timeout: 5000 });
          await stopBtn.click();

          await page.waitForSelector('.tutor-stopped-banner', { timeout: 5000 });
          const stoppedText = await page.locator('.tutor-stopped-banner').innerText();
          await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo04_tutor_cancelado.png') });
          return `1.ª respuesta con [MOCK] recibida; 2.ª pregunta cancelada ("${stoppedText.split('\n')[0].trim()}")`;
        } finally {
          await page.unroute('**/api/ai/chat');
        }
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 5: Tutor no disponible → botón deshabilitado con explicación
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      5,
      'Tutor no disponible → botón deshabilitado con explicación',
      async () => {
        await page.route('**/api/ai/status', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ok: false,
              available: false,
              engine: 'agy',
              code: 'AGY_NOT_FOUND',
              message: 'No encuentro Antigravity (agy) en este equipo.',
              fix: 'Instala Antigravity o define la variable de entorno GRANO_AGY_PATH.',
            }),
          });
        });

        try {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForSelector('.app-topbar', { timeout: 8000 });
          const panelVisible = await page.locator('[data-testid="tutor-panel"]').isVisible();
          if (!panelVisible) {
            await page.click('button.app-topbar__ask-btn');
          }
          await page.waitForSelector('[data-testid="tutor-unavailable-card"]', { timeout: 5000 });

          const unavailText = await page.locator('[data-testid="tutor-unavailable-card"]').innerText();
          const isTextareaDisabled = await page.locator('#tutor-question-textarea').isDisabled();
          const isSendDisabled = await page.locator('.tutor-panel__send-btn').isDisabled();
          const dataAttr = await page.evaluate(() =>
            document.documentElement.getAttribute('data-ai-available')
          );

          if (!isTextareaDisabled || !isSendDisabled || dataAttr !== 'false') {
            throw new Error(
              `Estado incoherente: textareaDisabled=${isTextareaDisabled}, sendDisabled=${isSendDisabled}, data-ai-available=${dataAttr}`
            );
          }

          await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo05_tutor_no_disponible.png') });
          await page.click('button[aria-label="Cerrar tutor (Esc)"]');
          return `Tarjeta honesta visible (${unavailText.split('\n')[0]}), input/botón deshabilitados`;
        } finally {
          await page.unroute('**/api/ai/status');
        }
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 6: Repaso: 3 tarjetas calificadas con teclas 1–4 tras pulsar Espacio
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      6,
      'Repaso: 3 tarjetas calificadas con teclas 1–4 tras pulsar Espacio',
      async () => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.app-sidebar__item', { hasText: 'Repaso' }).click();
        await page.waitForSelector('.review-view', { timeout: 8000 });

        // Si el mazo de hoy está vacío, activar práctica de mazo completo
        const activeCardVisible = await page.locator('[data-testid="fsrs-active-card"]').isVisible();
        if (!activeCardVisible) {
          await page
            .locator('.review-view button', {
              hasText: /Practicar mazo|Practicar catálogo/,
            })
            .first()
            .click();
        }

        await page.waitForSelector('[data-testid="fsrs-active-card"]', { timeout: 5000 });

        const ratings = ['3', '4', '2'];
        for (let i = 0; i < 3; i += 1) {
          await page.keyboard.press('Space');
          await page.waitForSelector('[data-testid="fsrs-rating-buttons"]', { timeout: 5000 });
          if (i === 0) {
            await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo06_repaso_reverso.png') });
          }
          await page.keyboard.press(ratings[i]);
          await page.waitForFunction(
            (expectedCount) => {
              const kicker = document.querySelector('.review-view .sec-kicker');
              return (
                kicker &&
                kicker.textContent.toLowerCase().includes(`${expectedCount} repasadas en sesión`)
              );
            },
            i + 1,
            { timeout: 5000 }
          );
        }

        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo06_repaso_3_calificadas.png') });
        return '3 tarjetas volteadas con Espacio y calificadas con teclas 3, 4 y 2';
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 7: Ajustes: cambia densidad a compacta y escala a 90 % → la barra superior mide 44 px
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      7,
      'Ajustes: cambia densidad a compacta y escala a 90 % → la barra superior mide 44 px',
      async () => {
        await page.locator('.app-sidebar__item', { hasText: 'Ajustes' }).click();
        await page.waitForSelector('.settings-view', { timeout: 8000 });

        await page
          .locator('[aria-label="Densidad de interfaz"] button', {
            hasText: 'Compacta',
          })
          .click();
        await page
          .locator('[aria-label="Escala tipográfica"] button', {
            hasText: '90 %',
          })
          .click();

        const metrics = await page.evaluate(() => {
          const topbar = document.querySelector('.app-topbar');
          const cs = window.getComputedStyle(topbar);
          return {
            density: document.documentElement.getAttribute('data-density'),
            scale: document.documentElement.getAttribute('data-scale'),
            offsetHeight: topbar.offsetHeight,
            computedHeight: cs.height,
          };
        });

        if (metrics.density !== 'compact' || metrics.scale !== '0.9' || metrics.offsetHeight !== 44) {
          throw new Error(`Métricas inesperadas en barra superior: ${JSON.stringify(metrics)}`);
        }

        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo07_ajustes_compacta_90.png') });

        // Restaurar densidad cómoda y escala 100 % para los siguientes flujos
        await page
          .locator('[aria-label="Densidad de interfaz"] button', {
            hasText: 'Cómoda',
          })
          .click();
        await page
          .locator('[aria-label="Escala tipográfica"] button', {
            hasText: '100 %',
          })
          .click();
        // Esperar a que venza el debounce de 300 ms del store antes del siguiente flujo
        await page.waitForTimeout(350);

        return `data-density="compact", data-scale="0.9", .app-topbar offsetHeight=${metrics.offsetHeight}px (${metrics.computedHeight})`;
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 8: Exportar progreso → reiniciar → importar → progreso restaurado
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      8,
      'Exportar progreso → reiniciar → importar → progreso restaurado',
      async () => {
        const fixtureRaw = fs.readFileSync(FIXTURE_PATH, 'utf8');
        await page.evaluate((raw) => {
          window.localStorage.setItem('grano:v1', raw);
        }, fixtureRaw);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.app-sidebar__item', { hasText: 'Ajustes' }).click();
        await page.waitForSelector('.settings-view', { timeout: 8000 });

        const getStats = async () =>
          page.evaluate(() =>
            Array.from(
              document.querySelectorAll(
                'section[aria-labelledby="settings-data-heading"] .sec-section__sub strong.tabular'
              )
            ).map((el) => el.textContent.trim())
          );

        const statsBefore = await getStats();
        if (statsBefore[0] !== '8' || statsBefore[1] !== '2' || statsBefore[2] !== '3') {
          throw new Error(
            `Estadísticas iniciales inesperadas antes de exportar: ${statsBefore.join(', ')}`
          );
        }

        // Exportar progreso
        const downloadPromise = page.waitForEvent('download');
        await page.locator('.settings-view button', { hasText: 'Exportar progreso' }).click();
        const download = await downloadPromise;
        const exportedFilePath = path.join(SHOTS_DIR, 'exported-progress-test.json');
        await download.saveAs(exportedFilePath);

        // Reiniciar todo escribiendo "reiniciar"
        await page.locator('.settings-view button', { hasText: 'Reiniciar todo' }).click();
        await page.fill('#settings-reset-input', 'reiniciar');
        await page.locator('button', { hasText: 'Confirmar reinicio' }).click();

        const statsAfterReset = await getStats();
        if (statsAfterReset[0] !== '0' || statsAfterReset[1] !== '0' || statsAfterReset[2] !== '0') {
          throw new Error(`El reinicio no puso a 0 los contadores: ${statsAfterReset.join(', ')}`);
        }
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo08_tras_reinicio.png') });

        // Importar archivo exportado
        const fileInput = page.locator(
          'input[type="file"][aria-label="Seleccionar archivo JSON de progreso"]'
        );
        await fileInput.setInputFiles(exportedFilePath);
        await page.waitForSelector('.settings-notice--ok', { timeout: 5000 });

        const statsAfterImport = await getStats();
        if (
          statsAfterImport[0] !== statsBefore[0] ||
          statsAfterImport[1] !== statsBefore[1] ||
          statsAfterImport[2] !== statsBefore[2]
        ) {
          throw new Error(
            `Progreso tras importar (${statsAfterImport.join('/')}) no coincide con el original (${statsBefore.join('/')})`
          );
        }

        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo08_progreso_restaurado.png') });
        if (fs.existsSync(exportedFilePath)) fs.unlinkSync(exportedFilePath);

        return `Exportado (${download.suggestedFilename()}) → reiniciado (0/0/0) → importado (${statsAfterImport.join('/')})`;
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 9: Ctrl+K → busca "fan-out" → abre la lección correspondiente
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      9,
      'Ctrl+K → busca "fan-out" → abre la lección correspondiente',
      async () => {
        await page.keyboard.press('Control+k');
        await page.waitForSelector('.cmd-palette-dialog .cmd-palette-input', { timeout: 5000 });
        await page.fill('.cmd-palette-input', 'fan-out');

        const lessonOption = page.locator('.cmd-palette-item', {
          hasText: 'Grano de una tabla y fan-out en JOINs',
        });
        await lessonOption.first().waitFor({ state: 'visible', timeout: 5000 });
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo09_ctrl_k_fanout.png') });

        await lessonOption.first().click();
        await page.waitForSelector('.lesson-player .lp-title', { timeout: 8000 });
        const openedTitle = await page.locator('.lesson-player .lp-title').innerText();
        if (!openedTitle.toLowerCase().includes('fan-out')) {
          throw new Error(`La lección abierta no corresponde a fan-out: ${openedTitle}`);
        }

        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo09_leccion_abierta.png') });
        return `Ctrl+K abrió "${openedTitle}"`;
      }
    );

    // -------------------------------------------------------------------------
    // Flujo 10: A 390×844: navegación inferior funciona en las 5 pestañas
    // -------------------------------------------------------------------------
    await runFlow(
      results,
      10,
      'A 390×844: navegación inferior funciona en las 5 pestañas',
      async () => {
        // Salir del modo foco de lección hacia Hoy para que la barra inferior esté activa en móvil
        await page.click('.app-topbar__brand');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForSelector('.app-bottom-nav', { timeout: 5000 });

        const navItems = page.locator('.app-bottom-nav .app-bottom-nav__item');
        const count = await navItems.count();
        if (count !== 5) {
          throw new Error(`Se esperaban 5 pestañas en .app-bottom-nav, encontradas: ${count}`);
        }

        // 1. Hoy
        await navItems.filter({ hasText: 'Hoy' }).click();
        await page.waitForSelector('.home-view', { timeout: 5000 });

        // 2. Ruta
        await navItems.filter({ hasText: 'Ruta' }).click();
        await page.waitForSelector('.roadmap-view', { timeout: 5000 });

        // 3. Repaso
        await navItems.filter({ hasText: 'Repaso' }).click();
        await page.waitForSelector('.review-view', { timeout: 5000 });

        // 4. Práctica
        await navItems.filter({ hasText: 'Práctica' }).click();
        await page.waitForSelector('[data-testid="practice-view"]', { timeout: 8000 });

        // 5. Más (abre hoja con Glosario, Progreso, Proyectos, Ajustes)
        await navItems.filter({ hasText: 'Más' }).click();
        await page.waitForSelector('.app-more-sheet', { timeout: 5000 });
        await page.screenshot({ path: path.join(SHOTS_DIR, 'Q1_flujo10_movil_390x844_mas.png') });

        await page.locator('.app-more-sheet__item', { hasText: 'Progreso' }).click();
        await page.waitForSelector('main', { timeout: 5000 });

        return '5 pestañas verificadas a 390×844 (Hoy, Ruta, Repaso, Práctica, Más → Progreso)';
      }
    );

    // -------------------------------------------------------------------------
    // Capturas reglamentarias adicionales (1280x720, 1440x900, 390x844 en light y dark)
    // -------------------------------------------------------------------------
    const viewports = [
      { w: 1280, h: 720 },
      { w: 1440, h: 900 },
      { w: 390, h: 844 },
    ];
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto(`${BASE_URL}/?view=home`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.app-topbar', { timeout: 8000 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate((t) => {
          document.documentElement.setAttribute('data-theme', t);
        }, theme);
        await page.waitForTimeout(150);
        await page.screenshot({
          path: path.join(SHOTS_DIR, `Q1_home_${vp.w}x${vp.h}_${theme}.png`),
        });
      }
    }

    await context.close();
  } finally {
    if (browser) await browser.close();
    viteProc.kill();
  }

  const failed = results.filter((r) => r.status !== 'PASS');
  console.log(`\n=== Resumen E2E: ${results.length - failed.length}/${results.length} flujos en PASS ===`);
  if (failed.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Error fatal en run-e2e.mjs:', err);
  process.exit(1);
});
