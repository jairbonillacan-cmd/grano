import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Security constants for the local Google AI Ultra CLI bridge.
 * Follows EXPRESS-BODY-001, EXPRESS-INPUT-001, EXPRESS-CMD-001, and EXPRESS-HEADERS-001.
 */
export const MAX_BODY_BYTES = 16384; // Strict 16 KB request body limit
export const MAX_PROMPT_CHARS = 2000; // Strict 2000-char limit for user prompt
const MAX_SQL_CHARS = 4000;
const MAX_TITLE_CHARS = 200;
const MAX_SIMULATOR_JSON_CHARS = 2000;
const MAX_CLI_STDOUT_BYTES = 65536;

const ALLOWED_LENSES = new Set(['DE', 'DA', 'BI', '360', 'DE + DA + BI']);
// engineMode -> modelo de agy. Sobrescribibles con GRANO_AI_MODEL_FAST / GRANO_AI_MODEL_DEEP.
const ENGINE_MODELS = {
  fast: process.env.GRANO_AI_MODEL_FAST || 'gemini-3.8-flash-low',
  deep: process.env.GRANO_AI_MODEL_DEEP || 'gemini-4-argon-medium',
};
const MODEL_ID_RE = /^[a-z0-9][a-z0-9.\-]{1,63}$/;
const CLI_TIMEOUT_MS = 120000;

// Carpeta vacía donde corre agy: el agente no ve los archivos del proyecto.
let sandboxDir = null;
function getSandboxDir() {
  if (!sandboxDir) {
    sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grano-ai-'));
  }
  return sandboxDir;
}
const ALLOWED_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Strips null bytes and dangerous control characters while preserving newlines and tabs.
 */
function cleanControlChars(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Sanitizes internal errors so stack traces, environment variables, or local filesystem paths
 * (e.g. C:\Users\... or /home/...) are never leaked to the browser client.
 */
export function sanitizeErrorMessage(err) {
  const raw = err && typeof err.message === 'string' ? err.message : '';
  if (!raw) {
    return 'Error interno al procesar la consulta en el puente local.';
  }
  if (raw.includes('Tiempo de espera agotado')) {
    return 'Tiempo de espera agotado en CLI local.';
  }
  // Never expose Windows or POSIX file paths, command lines, or stack traces
  if (
    /[A-Za-z]:\\/.test(raw) ||
    /\/(Users|home|var|etc|opt|tmp|usr)\//i.test(raw) ||
    /at\s+[^\n]+\([^\n]+\)/.test(raw) ||
    /spawn|ENOENT|EINVAL|EACCES/i.test(raw)
  ) {
    return 'El motor CLI local no pudo completar la ejecución de forma segura.';
  }
  return 'No se pudo completar la consulta en el motor local.';
}

/**
 * Sets mandatory defensive HTTP headers on every API response.
 */
function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

/**
 * Safely locates local CLI tools without invoking a shell (`shell: false`).
 * Resolves the underlying Node entrypoint for `gemini` on Windows so `spawn`
 * can execute `node.exe` directly with `shell: false` and pass user prompts via `stdin`.
 */
export function detectCliTools() {
  const isWin = process.platform === 'win32';
  const locatorBin = isWin ? 'where.exe' : 'which';

  let hasGemini = false;
  let geminiEntrypoint = null;
  let hasAgy = false;
  let agyBinPath = null;

  try {
    const out = execFileSync(locatorBin, [isWin ? 'gemini.cmd' : 'gemini'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
      timeout: 3000,
    });
    const firstMatch = out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (firstMatch) {
      if (isWin) {
        const candidateJs = path.join(
          path.dirname(firstMatch),
          'node_modules',
          '@google',
          'gemini-cli',
          'bundle',
          'gemini.js'
        );
        if (fs.existsSync(candidateJs)) {
          hasGemini = true;
          geminiEntrypoint = candidateJs;
        }
      } else {
        hasGemini = true;
        geminiEntrypoint = firstMatch;
      }
    }
  } catch {
    // Fallback check for non-.cmd binary on Windows if applicable
    if (isWin) {
      try {
        const out = execFileSync(locatorBin, ['gemini'], {
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf8',
          shell: false,
          windowsHide: true,
          timeout: 3000,
        });
        const firstMatch = out
          .split(/\r?\n/)
          .map((line) => line.trim())
          .find(Boolean);
        if (firstMatch) {
          const candidateJs = path.join(
            path.dirname(firstMatch),
            'node_modules',
            '@google',
            'gemini-cli',
            'bundle',
            'gemini.js'
          );
          if (fs.existsSync(candidateJs)) {
            hasGemini = true;
            geminiEntrypoint = candidateJs;
          }
        }
      } catch {}
    }
  }

  try {
    const out = execFileSync(locatorBin, [isWin ? 'agy.exe' : 'agy'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
      timeout: 3000,
    });
    const firstMatch = out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    if (firstMatch && fs.existsSync(firstMatch)) {
      hasAgy = true;
      agyBinPath = firstMatch;
    }
  } catch {}

  return { hasGemini, geminiEntrypoint, hasAgy, agyBinPath };
}

/**
 * Executes a CLI prompt without ever invoking a command shell (`shell: false`)
 * or interpolating user input into a shell command string (EXPRESS-CMD-001).
 * User prompt content is piped exclusively via `stdin` (or strict arg array with `shell: false`).
 */
export function runCliPrompt(cliInfo, cliType, fullPrompt, timeoutMs = CLI_TIMEOUT_MS, model = ENGINE_MODELS.fast) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    let executable = '';
    let args = [];
    let writeToStdin = false;
    let cwd;

    if (cliType === 'agy' && cliInfo.hasAgy && cliInfo.agyBinPath) {
      // agy lee el prompt por stdin. No usar `--print -- texto` (agy lo rechaza),
      // ni `--mode plan` (redacta un plan en vez de responder),
      // ni `--dangerously-skip-permissions`.
      if (!MODEL_ID_RE.test(model)) {
        reject(new Error('Modelo no válido'));
        return;
      }
      executable = cliInfo.agyBinPath;
      args = ['--model', model, '--sandbox', '--disable-slash-commands'];
      writeToStdin = true;
      cwd = getSandboxDir();
    } else if (cliType === 'gemini' && cliInfo.hasGemini && cliInfo.geminiEntrypoint) {
      // Solo si se pide explícitamente: gemini CLI ya no acepta cuentas individuales
      // (IneligibleTierError, oct-2026). El tutor usa siempre agy.
      if (isWin) {
        executable = process.execPath; // Hardcoded Node.js runtime executable
        args = [
          cliInfo.geminiEntrypoint,
          '-p',
          'Responde en español con rigor técnico siguiendo el contexto recibido por stdin.',
          '-o',
          'text',
        ];
      } else {
        executable = cliInfo.geminiEntrypoint;
        args = [
          '-p',
          'Responde en español con rigor técnico siguiendo el contexto recibido por stdin.',
          '-o',
          'text',
        ];
      }
      writeToStdin = true;
    } else {
      reject(new Error('CLI no disponible'));
      return;
    }

    const child = spawn(executable, args, {
      stdio: [writeToStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
      shell: false, // SECURITY: Never invoke cmd.exe, powershell.exe, or /bin/sh
      windowsHide: true,
      cwd,
    });

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Tiempo de espera agotado en CLI local'));
    }, timeoutMs);

    if (writeToStdin && child.stdin) {
      child.stdin.on('error', () => {
        // Ignore broken pipe if process exits early; handled in 'close'
      });
      child.stdin.end(fullPrompt, 'utf8');
    }

    child.stdout.on('data', (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes <= MAX_CLI_STDOUT_BYTES) {
        stdout += chunk.toString('utf8');
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < 4096) {
        stderr += chunk.toString('utf8');
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const cleaned = stdout.trim();
      if (cleaned.length > 0) {
        resolve(cleaned);
      } else {
        reject(new Error(stderr.trim() || `CLI salió con código ${code}`));
      }
    });
  });
}

/**
 * Traduce un fallo del CLI a un error honesto para la interfaz: qué pasó y qué hacer.
 * Nunca se sustituye por una respuesta pre-escrita.
 */
export function classifyCliError(err) {
  const raw = err && typeof err.message === 'string' ? err.message : '';
  if (raw === 'CLI no disponible' || err?.code === 'ENOENT') {
    return { code: 'AGY_NOT_FOUND', message: 'No encuentro Antigravity (agy) en este equipo.', fix: 'Instala Antigravity y comprueba que `agy --help` funcione en una terminal.' };
  }
  if (raw.includes('Tiempo de espera agotado')) {
    return { code: 'AGY_TIMEOUT', message: 'La IA tardó demasiado en responder.', fix: 'Reintenta o cambia al modelo Rápido.' };
  }
  if (/login|sign.?in|auth|credential|sesi[oó]n/i.test(raw)) {
    return { code: 'AGY_AUTH', message: 'Antigravity no tiene una sesión iniciada.', fix: 'Abre Antigravity, inicia sesión y vuelve a preguntar.' };
  }
  if (/quota|rate.?limit|resource.?exhausted|l[ií]mite/i.test(raw)) {
    return { code: 'AGY_QUOTA', message: 'Se alcanzó el límite de uso de tu suscripción.', fix: 'Prueba más tarde o cambia de modelo.' };
  }
  return { code: 'AGY_FAILED', message: 'La IA no pudo responder.', fix: 'Reintenta. Si se repite, ejecuta `agy --print "hola"` en una terminal para ver el error.' };
}

/**
 * Validates and normalizes the incoming `/api/ai/query` JSON payload (EXPRESS-INPUT-001).
 */
function validateQueryPayload(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { valid: false, status: 400, error: 'El cuerpo de la solicitud debe ser un objeto JSON válido.' };
  }

  if (typeof payload.prompt !== 'string') {
    return { valid: false, status: 400, error: 'El campo "prompt" debe ser una cadena de texto.' };
  }

  const prompt = cleanControlChars(payload.prompt);
  if (prompt.length === 0) {
    return { valid: false, status: 400, error: 'La consulta no puede estar vacía.' };
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return {
      valid: false,
      status: 400,
      error: `La consulta supera el límite máximo de ${MAX_PROMPT_CHARS} caracteres.`,
    };
  }

  const moduleTitle =
    typeof payload.moduleTitle === 'string'
      ? cleanControlChars(payload.moduleTitle).slice(0, MAX_TITLE_CHARS)
      : '';

  const rawLens = typeof payload.activeLens === 'string' ? cleanControlChars(payload.activeLens) : '360';
  const activeLens = ALLOWED_LENSES.has(rawLens) ? rawLens : '360';

  const rawEngineMode =
    typeof payload.engineMode === 'string' ? cleanControlChars(payload.engineMode) : 'fast';
  const engineMode = Object.hasOwn(ENGINE_MODELS, rawEngineMode) ? rawEngineMode : 'fast';

  const sqlCode =
    typeof payload.sqlCode === 'string'
      ? cleanControlChars(payload.sqlCode).slice(0, MAX_SQL_CHARS)
      : '';

  let simulatorState = null;
  if (
    payload.simulatorState &&
    typeof payload.simulatorState === 'object' &&
    !Array.isArray(payload.simulatorState)
  ) {
    try {
      const serialized = JSON.stringify(payload.simulatorState);
      if (serialized.length <= MAX_SIMULATOR_JSON_CHARS) {
        simulatorState = JSON.parse(serialized);
      }
    } catch {
      simulatorState = null;
    }
  }

  const relatedNodes = Array.isArray(payload.relatedNodes)
    ? payload.relatedNodes.slice(0, 10).map((item) => ({
        discipline:
          item && typeof item.discipline === 'string'
            ? cleanControlChars(item.discipline).slice(0, 16)
            : '360',
        title:
          item && typeof item.title === 'string'
            ? cleanControlChars(item.title).slice(0, 120)
            : '',
        connection:
          item && typeof item.connection === 'string'
            ? cleanControlChars(item.connection).slice(0, 240)
            : '',
      }))
    : [];

  return {
    valid: true,
    data: {
      prompt,
      moduleTitle,
      activeLens,
      engineMode,
      sqlCode,
      simulatorState,
      relatedNodes,
    },
  };
}

/**
 * Creates a hardened middleware for `/api/ai/status` and `/api/ai/query`.
 * Can be mounted directly via `middlewares.use(createGoogleAiUltraMiddleware())`
 * or attached to a Connect/Vite middleware stack by passing `middlewares` as an argument.
 */
export function createGoogleAiUltraMiddleware(middlewares = null) {
  const cliInfo = detectCliTools();

  const handleStatus = (req, res) => {
    setSecurityHeaders(res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
      return;
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        available: cliInfo.hasAgy,
        engine: cliInfo.hasAgy ? 'agy' : null,
        models: ENGINE_MODELS,
        cli: {
          gemini: cliInfo.hasGemini,
          agy: cliInfo.hasAgy,
        },
        security: {
          shellExecution: false,
          maxBodyBytes: MAX_BODY_BYTES,
          maxPromptChars: MAX_PROMPT_CHARS,
        },
      })
    );
  };

  const handleQuery = (req, res) => {
    setSecurityHeaders(res);

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
      return;
    }

    // Defense-in-depth: block cross-origin requests from external websites to local dev server
    const origin = req.headers['origin'];
    if (typeof origin === 'string' && !ALLOWED_ORIGIN_RE.test(origin)) {
      res.statusCode = 403;
      res.end(JSON.stringify({ ok: false, error: 'Origin Not Allowed' }));
      return;
    }

    const contentType = req.headers['content-type'] || '';
    if (contentType && !contentType.toLowerCase().includes('application/json')) {
      res.statusCode = 415;
      res.end(JSON.stringify({ ok: false, error: 'Unsupported Media Type: se requiere application/json' }));
      return;
    }

    let receivedBytes = 0;
    let abortedForSize = false;
    const chunks = [];

    req.on('data', (chunk) => {
      if (abortedForSize) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8');
      receivedBytes += buf.byteLength;

      if (receivedBytes > MAX_BODY_BYTES) {
        abortedForSize = true;
        res.statusCode = 413;
        res.end(
          JSON.stringify({
            ok: false,
            error: `El cuerpo de la solicitud supera el límite máximo de ${MAX_BODY_BYTES} bytes (16 KB).`,
          })
        );
        req.destroy();
        return;
      }
      chunks.push(buf);
    });

    req.on('end', async () => {
      if (abortedForSize || res.writableEnded) return;

      let parsedBody;
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        parsedBody = JSON.parse(rawBody || '{}');
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Formato JSON inválido.' }));
        return;
      }

      const validation = validateQueryPayload(parsedBody);
      if (!validation.valid) {
        res.statusCode = validation.status;
        res.end(JSON.stringify({ ok: false, error: validation.error }));
        return;
      }

      const {
        prompt,
        moduleTitle,
        activeLens,
        engineMode,
        sqlCode,
        simulatorState,
        relatedNodes,
      } = validation.data;

      const lensText =
        activeLens === 'DE' || activeLens === 'DA' || activeLens === 'BI'
          ? `La persona estudia desde el área ${activeLens}.`
          : '';
      const relatedText = relatedNodes.length
        ? `Lecciones relacionadas: ${relatedNodes.map((n) => n.title).filter(Boolean).join('; ')}`
        : '';

      const fullPrompt = [
        'Eres el tutor de una escuela de datos en español (ingeniería de datos, análisis de datos y business intelligence).',
        moduleTitle ? `Lección actual: "${moduleTitle}".` : '',
        lensText,
        sqlCode ? `Consulta SQL de la lección:\n${sqlCode}` : '',
        simulatorState ? `Estado del simulador: ${JSON.stringify(simulatorState)}` : '',
        relatedText,
        [
          'Cómo responder:',
          '- Español neutro, tuteo, frases cortas. Ve directo a la respuesta.',
          '- Responde lo que se pregunta; conecta con la lección solo si ayuda.',
          '- Usa un ejemplo concreto cuando aclare la idea.',
          '- Si no estás seguro de un dato que depende de versión, dilo.',
          '- Máximo 300 palabras salvo que pidan más. Sin emojis ni frases de relleno.',
          '- No ejecutes herramientas ni crees archivos: responde solo con texto.',
        ].join('\n'),
        `Pregunta: ${prompt}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const model = ENGINE_MODELS[engineMode];
      const startedAt = Date.now();
      try {
        const output = await runCliPrompt(cliInfo, 'agy', fullPrompt, CLI_TIMEOUT_MS, model);
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            source: `Google AI Ultra · ${model}`,
            model,
            answer: output,
            elapsedMs: Date.now() - startedAt,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (err) {
        const info = classifyCliError(err);
        // El detalle técnico (stderr) solo va al log local, nunca al navegador.
        console.warn(`[ai] ${info.code}: ${String(err?.message || '').slice(0, 300)}`);
        res.statusCode = info.code === 'AGY_NOT_FOUND' ? 503 : 502;
        res.end(JSON.stringify({ ok: false, ...info, error: info.message }));
      }
    });
  };

  const middleware = (req, res, next) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname === '/api/ai/status') {
      handleStatus(req, res);
      return;
    }
    if (pathname === '/api/ai/query') {
      handleQuery(req, res);
      return;
    }
    if (typeof next === 'function') {
      next();
    }
  };

  if (middlewares && typeof middlewares.use === 'function') {
    middlewares.use('/api/ai/status', handleStatus);
    middlewares.use('/api/ai/query', handleQuery);
  }

  middleware.handleStatus = handleStatus;
  middleware.handleQuery = handleQuery;
  middleware.attach = (targetMiddlewares) => {
    if (targetMiddlewares && typeof targetMiddlewares.use === 'function') {
      targetMiddlewares.use('/api/ai/status', handleStatus);
      targetMiddlewares.use('/api/ai/query', handleQuery);
    }
  };

  return middleware;
}

export function googleAiUltraBridgePlugin() {
  const middleware = createGoogleAiUltraMiddleware();
  return {
    name: 'google-ai-ultra-bridge',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default createGoogleAiUltraMiddleware;
