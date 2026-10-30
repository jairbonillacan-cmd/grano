import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// gemini CLI v0.50.0 eliminado: devuelve IneligibleTierError para cuentas individuales; se usa siempre agy

export const FIRST_BYTE_TIMEOUT_MS = 45_000; // 45 s hasta el primer byte
export const TOTAL_TIMEOUT_MS = 120_000; // 120 s total
export const MODEL_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
export const MAX_CLI_STDOUT_BYTES = 131_072; // 128 KB

export const MODEL_ID_RE = /^[a-z0-9][a-z0-9.\-]{1,63}$/;

export const FALLBACK_MODELS = [
  { id: 'gemini-4-argon-medium', label: 'Gemini 4 Argon (Medium)' },
  { id: 'gemini-4-argon-high', label: 'Gemini 4 Argon (High)' },
  { id: 'gemini-4-argon-low', label: 'Gemini 4 Argon (Low)' },
  { id: 'gemini-3.8-flash-high', label: 'Gemini 3.8 Flash (High)' },
  { id: 'gemini-3.8-flash-medium', label: 'Gemini 3.8 Flash (Medium)' },
  { id: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low)' },
  { id: 'claude-opus-5-5-low', label: 'Claude Opus 5.5 (Low)' },
  { id: 'claude-opus-5-5-medium', label: 'Claude Opus 5.5 (Medium)' },
  { id: 'claude-opus-5-5-high', label: 'Claude Opus 5.5 (High)' },
  { id: 'claude-sonnet-5-5-low', label: 'Claude Sonnet 5.5 (Low)' },
  { id: 'claude-sonnet-5-5-medium', label: 'Claude Sonnet 5.5 (Medium)' },
  { id: 'claude-sonnet-5-5-high', label: 'Claude Sonnet 5.5 (High)' },
  { id: 'gpt-oss-120b-medium', label: 'GPT-OSS 120B (Medium)' },
];

export function getDefaultModels() {
  return {
    fast: process.env.GRANO_AI_MODEL_FAST || 'gemini-3.8-flash-low',
    deep: process.env.GRANO_AI_MODEL_DEEP || 'gemini-4-argon-medium',
  };
}

export function isMockEnabled() {
  return process.env.GRANO_AI_MOCK === '1';
}

// Carpeta vacía en os.tmpdir() donde corre agy para que no vea archivos del proyecto.
let sandboxDir = null;
export function getSandboxDir() {
  if (!sandboxDir || !fs.existsSync(sandboxDir)) {
    sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grano-ai-'));
  }
  return sandboxDir;
}

/**
 * Localiza el ejecutable `agy` sin invocar nunca una shell (`shell: false`).
 * Si `GRANO_AGY_PATH` está definido, comprueba exactamente esa ruta sin buscar en PATH.
 */
export function detectAgy(explicitEnvPath) {
  const configured =
    explicitEnvPath !== undefined ? explicitEnvPath : process.env.GRANO_AGY_PATH;

  if (typeof configured === 'string' && configured.trim().length > 0) {
    const candidate = configured.trim();
    const exists = fs.existsSync(candidate);
    return {
      hasAgy: exists,
      agyBinPath: exists ? candidate : null,
      configuredPath: candidate,
    };
  }

  const isWin = process.platform === 'win32';
  const locatorBin = isWin ? 'where.exe' : 'which';

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
      return { hasAgy: true, agyBinPath: firstMatch, configuredPath: null };
    }
  } catch {}

  if (isWin) {
    const fallbackWin = path.join(
      os.homedir(),
      'AppData',
      'Local',
      'agy',
      'bin',
      'agy.exe'
    );
    if (fs.existsSync(fallbackWin)) {
      return { hasAgy: true, agyBinPath: fallbackWin, configuredPath: null };
    }
  }

  return { hasAgy: false, agyBinPath: null, configuredPath: null };
}

const versionCache = new Map();

/**
 * Obtiene la versión de `agy` (`agy --version`).
 */
export function getAgyVersion(agyBinPath) {
  if (!agyBinPath) return null;
  if (versionCache.has(agyBinPath)) {
    return versionCache.get(agyBinPath);
  }
  try {
    const out = execFileSync(agyBinPath, ['--version'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
      timeout: 5000,
    });
    const ver = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean);
    if (ver) {
      versionCache.set(agyBinPath, ver);
      return ver;
    }
  } catch {}
  return null;
}

/**
 * Parsea la salida de `agy models` en objetos `{ id, label }`.
 */
export function parseAgyModelsOutput(rawOutput) {
  if (typeof rawOutput !== 'string') return [];
  const models = [];
  const seen = new Set();

  for (const rawLine of rawOutput.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('Fetching')) continue;
    const parts = line.split(/\t+/);
    if (parts.length >= 2) {
      const id = parts[0].trim();
      const label = parts.slice(1).join(' ').trim();
      if (MODEL_ID_RE.test(id) && !seen.has(id)) {
        seen.add(id);
        models.push({ id, label: label || id });
      }
    } else if (MODEL_ID_RE.test(line) && !seen.has(line)) {
      seen.add(line);
      models.push({ id: line, label: line });
    }
  }
  return models;
}

let modelsCache = {
  binPath: null,
  fetchedAt: 0,
  models: [],
};

export function resetModelsCache() {
  modelsCache = { binPath: null, fetchedAt: 0, models: [] };
}

/**
 * Obtiene y cachea durante 10 minutos la lista de modelos de `agy models`.
 */
export function fetchAgyModels({
  agyBinPath,
  force = false,
  ttlMs = MODEL_CACHE_TTL_MS,
  spawnImpl = spawn,
  now = Date.now(),
} = {}) {
  return new Promise((resolve, reject) => {
    if (isMockEnabled() && spawnImpl === spawn && !process.env.GRANO_AGY_PATH) {
      resolve({ models: FALLBACK_MODELS, cached: true });
      return;
    }

    const resolvedBin = agyBinPath !== undefined ? agyBinPath : detectAgy().agyBinPath;

    if (!resolvedBin) {
      const err = new Error('CLI no disponible');
      err.code = 'AGY_NOT_FOUND';
      reject(err);
      return;
    }

    if (
      !force &&
      modelsCache.binPath === resolvedBin &&
      modelsCache.models.length > 0 &&
      now - modelsCache.fetchedAt < ttlMs
    ) {
      resolve({ models: modelsCache.models, cached: true });
      return;
    }

    const child = spawnImpl(resolvedBin, ['models'], {
      cwd: getSandboxDir(),
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      const err = new Error('Tiempo de espera agotado al consultar agy models');
      err.code = 'AGY_TIMEOUT';
      reject(err);
    }, 15_000);

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const parsed = parseAgyModelsOutput(stdout);
      if (parsed.length > 0) {
        modelsCache = {
          binPath: resolvedBin,
          fetchedAt: Date.now(),
          models: parsed,
        };
        resolve({ models: parsed, cached: false });
      } else if (code === 0 && modelsCache.models.length > 0) {
        resolve({ models: modelsCache.models, cached: true });
      } else {
        const err = new Error(stderr.trim() || `agy models salió con código ${code}`);
        reject(err);
      }
    });
  });
}

/**
 * Construye el array estricto de argumentos para `agy`.
 * Prohibido incluir `--`, `--mode`, `--dangerously-skip-permissions` o `--add-dir`.
 */
export function buildAgyArgs(model) {
  if (typeof model !== 'string' || !MODEL_ID_RE.test(model)) {
    const err = new Error(`Modelo no válido: ${String(model)}`);
    err.code = 'INVALID_MODEL';
    throw err;
  }
  return ['--model', model, '--sandbox', '--disable-slash-commands'];
}

/**
 * Resuelve alias ('fast', 'deep') y valida que el modelo esté en la lista permitida de `agy models`.
 */
export function resolveAndValidateModel(requestedModel, allowedModels = FALLBACK_MODELS) {
  const defaults = getDefaultModels();
  let target = requestedModel;
  if (!target || target === 'fast') {
    target = defaults.fast;
  } else if (target === 'deep') {
    target = defaults.deep;
  }

  if (typeof target !== 'string' || !MODEL_ID_RE.test(target)) {
    const err = new Error(`Identificador de modelo inválido: "${String(target)}".`);
    err.code = 'INVALID_MODEL';
    throw err;
  }

  if (Array.isArray(allowedModels) && allowedModels.length > 0) {
    const ids = new Set(allowedModels.map((m) => (typeof m === 'string' ? m : m.id)));
    // Permitir también los modelos configurados por entorno si coinciden con MODEL_ID_RE
    ids.add(defaults.fast);
    ids.add(defaults.deep);
    if (!ids.has(target)) {
      const err = new Error(`El modelo "${target}" no figura en la lista de agy models.`);
      err.code = 'INVALID_MODEL';
      throw err;
    }
  }

  return target;
}

/**
 * Traduce cualquier fallo del proceso `agy` a la tabla exacta.
 * Prohibido devolver respuestas falsas o pre-escritas.
 */
export function classifyCliError(err) {
  const raw = err && typeof err.message === 'string' ? err.message : '';
  const code = err?.code || '';

  if (
    code === 'AGY_NOT_FOUND' ||
    code === 'ENOENT' ||
    raw === 'CLI no disponible' ||
    /not found|no se encontr[oó]|ENOENT/i.test(raw)
  ) {
    return {
      code: 'AGY_NOT_FOUND',
      message: 'No encuentro Antigravity (agy) en este equipo.',
      fix: 'Instala Antigravity o define GRANO_AGY_PATH.',
    };
  }

  if (
    code === 'AGY_TIMEOUT' ||
    /tiempo de espera agotado|timeout|timed out/i.test(raw)
  ) {
    return {
      code: 'AGY_TIMEOUT',
      message: 'La IA tardó demasiado en responder.',
      fix: 'Reintenta o cambia al modelo Rápido.',
    };
  }

  if (
    code === 'AGY_AUTH' ||
    /login|sign.?in|auth|unauthenticated|credential|sesi[oó]n|not logged in|token expired/i.test(raw)
  ) {
    return {
      code: 'AGY_AUTH',
      message: 'Antigravity no tiene una sesión iniciada.',
      fix: 'Abre Antigravity, inicia sesión y pulsa Reintentar.',
    };
  }

  if (
    code === 'AGY_QUOTA' ||
    /quota|rate.?limit|resource.?exhausted|429|l[ií]mite de uso|too many requests/i.test(raw)
  ) {
    return {
      code: 'AGY_QUOTA',
      message: 'Se alcanzó el límite de uso de tu suscripción.',
      fix: 'Prueba más tarde o usa otro modelo.',
    };
  }

  return {
    code: 'AGY_FAILED',
    message: 'La IA no pudo responder.',
    fix: 'Reintenta. Si se repite, ejecuta `npm run ai:check`.',
  };
}

/**
 * Genera una respuesta simulada exclusivamente cuando `GRANO_AI_MOCK=1`.
 * Cada respuesta empieza obligatoriamente por `[MOCK]`.
 */
function buildMockOutput(prompt, jsonMode = null) {
  if (jsonMode === 'feynman') {
    return JSON.stringify({
      score: 3,
      aciertos: ['[MOCK] Explicaste con claridad qué representa cada fila de la tabla.'],
      huecos: ['[MOCK] Faltó mencionar qué ocurre con los valores nulos tras un LEFT JOIN.'],
      siguientePaso: '[MOCK] Repasa la diferencia entre COUNT(*) y COUNT(columna) en Mercado Brisa.',
    });
  }
  if (jsonMode === 'quiz-more') {
    return JSON.stringify({
      questions: [
        {
          id: 'q1',
          prompt: '[MOCK] En Mercado Brisa, ¿qué representa una fila de la tabla orders?',
          options: [
            { id: 'a', text: 'Un pedido único', correct: true, feedback: '[MOCK] Correcto: order_id es la clave primaria.' },
            { id: 'b', text: 'Un producto dentro del carrito', correct: false, feedback: '[MOCK] Eso corresponde a order_items.' },
            { id: 'c', text: 'Un pago con tarjeta', correct: false, feedback: '[MOCK] Eso corresponde a payments.' },
          ],
          explanation: '[MOCK] El grano de orders es un pedido por fila.',
        },
        {
          id: 'q2',
          prompt: '[MOCK] ¿Qué ocurre al sumar orders.total_usd tras un JOIN directo con order_items?',
          options: [
            { id: 'a', text: 'Se duplica el total por cada ítem del pedido', correct: true, feedback: '[MOCK] Exacto, se produce fan-out 1:N.' },
            { id: 'b', text: 'El motor SQL agrupa automáticamente', correct: false, feedback: '[MOCK] SQL no deduce el grano sin una CTE previa.' },
            { id: 'c', text: 'Devuelve NULL', correct: false, feedback: '[MOCK] Suma los valores repetidos.' },
          ],
          explanation: '[MOCK] Unir 1:N repite las filas de cabecera.',
        },
        {
          id: 'q3',
          prompt: '[MOCK] ¿Cómo se evita el fan-out antes de unir order_items con orders?',
          options: [
            { id: 'a', text: 'Pre-agregando order_items por order_id en una CTE', correct: true, feedback: '[MOCK] Así ambas tablas tienen grano order_id (1:1).' },
            { id: 'b', text: 'Usando CROSS JOIN', correct: false, feedback: '[MOCK] Un CROSS JOIN multiplica todas las filas.' },
            { id: 'c', text: 'Quitando la cláusula ON', correct: false, feedback: '[MOCK] Eso no es válido o genera producto cartesiano.' },
          ],
          explanation: '[MOCK] Igualar el grano antes del JOIN garantiza cardinalidad 1:1.',
        },
      ],
    });
  }
  if (jsonMode === 'interview-grade') {
    return JSON.stringify({
      score: 3,
      fortalezas: ['[MOCK] Identificaste el grano de las tablas antes de proponer el JOIN.'],
      mejoras: ['[MOCK] Conviene añadir una comprobación de reconciliación con SUM(total_usd).'],
      respuestaModelo: '[MOCK] Primero verifico el grano de orders y order_items, pre-agrego por order_id en una CTE y compruebo que el total cuadre.',
      siguientePregunta: '[MOCK] ¿Cómo cambiarías tu consulta si un pedido pudiera tener varios reembolsos parciales en refunds?',
    });
  }
  const snippet = String(prompt || '').slice(-120).replace(/\s+/g, ' ').trim();
  return `[MOCK] Respuesta simulada para pruebas automatizadas (${snippet.slice(0, 60)}).`;
}

/**
 * Ejecuta `agy` en streaming pasando el prompt por `stdin` y sin shell (`shell: false`).
 * Soporta timeout al primer byte (45 s), timeout total (120 s) y cancelación por `AbortSignal`.
 */
export function runAgyStream({
  prompt,
  model,
  agyBinPath,
  allowedModels,
  onMeta,
  onDelta,
  onDone,
  signal,
  spawnImpl = spawn,
  firstByteTimeoutMs = FIRST_BYTE_TIMEOUT_MS,
  totalTimeoutMs = TOTAL_TIMEOUT_MS,
  jsonMode = null,
} = {}) {
  return new Promise(async (resolve, reject) => {
    if (signal?.aborted) {
      const abortErr = new Error('Ejecución cancelada antes de iniciar.');
      abortErr.code = 'ABORTED';
      reject(abortErr);
      return;
    }

    let resolvedModel;
    try {
      let modelsList = allowedModels;
      if (!modelsList && modelsCache.models.length > 0) {
        modelsList = modelsCache.models;
      }
      resolvedModel = resolveAndValidateModel(model, modelsList || FALLBACK_MODELS);
    } catch (validationErr) {
      reject(validationErr);
      return;
    }

    const startedAt = Date.now();

    // Modo mock exclusivo para pruebas automatizadas cuando GRANO_AI_MOCK=1 y no se inyecta spawnImpl propio
    if (isMockEnabled() && spawnImpl === spawn && !process.env.GRANO_AGY_PATH) {
      const mockText = buildMockOutput(prompt, jsonMode);
      const chunks = [
        mockText.slice(0, Math.ceil(mockText.length / 2)),
        mockText.slice(Math.ceil(mockText.length / 2)),
      ].filter(Boolean);

      onMeta?.({ model: resolvedModel, startedAt, mock: true });

      let cancelled = false;
      const onAbort = () => {
        cancelled = true;
        const abortErr = new Error('Ejecución mock cancelada por el cliente.');
        abortErr.code = 'ABORTED';
        reject(abortErr);
      };
      signal?.addEventListener('abort', onAbort, { once: true });

      setTimeout(() => {
        if (cancelled) return;
        const firstTokenMs = Date.now() - startedAt;
        for (const piece of chunks) {
          onDelta?.(piece, { firstTokenMs });
        }
        signal?.removeEventListener('abort', onAbort);
        const durationMs = Date.now() - startedAt;
        const result = {
          text: mockText,
          model: resolvedModel,
          firstTokenMs,
          durationMs,
          chars: mockText.length,
          mock: true,
        };
        onDone?.(result);
        resolve(result);
      }, 35);
      return;
    }

    const detected = agyBinPath
      ? { hasAgy: fs.existsSync(agyBinPath) || spawnImpl !== spawn, agyBinPath }
      : detectAgy();

    if (!detected.hasAgy || !detected.agyBinPath) {
      const notFoundErr = new Error('CLI no disponible');
      notFoundErr.code = 'AGY_NOT_FOUND';
      reject(notFoundErr);
      return;
    }

    let args;
    try {
      args = buildAgyArgs(resolvedModel);
    } catch (argErr) {
      reject(argErr);
      return;
    }

    let child;
    try {
      child = spawnImpl(detected.agyBinPath, args, {
        cwd: getSandboxDir(),
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (spawnErr) {
      reject(spawnErr);
      return;
    }

    onMeta?.({ model: resolvedModel, startedAt, pid: child.pid });

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let firstTokenMs = null;
    let settled = false;
    let timedOutReason = null;
    let aborted = false;

    const cleanup = () => {
      clearTimeout(firstByteTimer);
      clearTimeout(totalTimer);
      if (signal && onAbort) {
        signal.removeEventListener('abort', onAbort);
      }
    };

    const killChild = () => {
      try {
        child.kill('SIGTERM');
      } catch {}
    };

    const firstByteTimer = setTimeout(() => {
      if (firstTokenMs === null && !settled) {
        timedOutReason = 'Tiempo de espera agotado: sin primer byte en 45 s';
        killChild();
      }
    }, firstByteTimeoutMs);

    const totalTimer = setTimeout(() => {
      if (!settled) {
        timedOutReason = 'Tiempo de espera agotado: límite total de 120 s superado';
        killChild();
      }
    }, totalTimeoutMs);

    const onAbort = () => {
      if (settled) return;
      aborted = true;
      killChild();
      settled = true;
      cleanup();
      const abortErr = new Error('Ejecución cancelada por cierre del cliente.');
      abortErr.code = 'ABORTED';
      reject(abortErr);
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    if (child.stdin) {
      child.stdin.on('error', () => {
        // Ignorar EPIPE si el proceso hijo cierra antes
      });
      child.stdin.end(String(prompt || ''), 'utf8');
    }

    child.stdout?.on('data', (chunk) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8');
      if (buf.byteLength === 0) return;

      if (firstTokenMs === null) {
        firstTokenMs = Date.now() - startedAt;
        clearTimeout(firstByteTimer);
      }

      stdoutBytes += buf.byteLength;
      if (stdoutBytes <= MAX_CLI_STDOUT_BYTES) {
        const textChunk = buf.toString('utf8');
        stdout += textChunk;
        onDelta?.(textChunk, { firstTokenMs });
      }
    });

    child.stderr?.on('data', (chunk) => {
      if (stderr.length < 4096) {
        stderr += chunk.toString('utf8');
      }
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      cleanup();

      if (aborted) {
        const abortErr = new Error('Ejecución cancelada por cierre del cliente.');
        abortErr.code = 'ABORTED';
        reject(abortErr);
        return;
      }

      if (timedOutReason) {
        const timeoutErr = new Error(timedOutReason);
        timeoutErr.code = 'AGY_TIMEOUT';
        reject(timeoutErr);
        return;
      }

      const cleaned = stdout.trim();
      if (cleaned.length > 0 && (code === 0 || code === null)) {
        const durationMs = Date.now() - startedAt;
        const result = {
          text: cleaned,
          model: resolvedModel,
          firstTokenMs: firstTokenMs ?? durationMs,
          durationMs,
          chars: cleaned.length,
        };
        onDone?.(result);
        resolve(result);
      } else {
        const rawErr = stderr.trim() || `agy finalizó con código ${code}`;
        // Registrar stderr recortado solo en el log del servidor, nunca enviarlo al navegador
        console.warn(`[agyRunner] fallo (code=${code}): ${rawErr.slice(0, 300)}`);
        const err = new Error(rawErr);
        reject(err);
      }
    });
  });
}

/**
 * Ejecuta `agy` y resuelve con el texto completo (para `/api/ai/json`, `/api/ai/query` o `ai:check`).
 */
export async function runAgyPrompt(options) {
  return runAgyStream(options);
}
