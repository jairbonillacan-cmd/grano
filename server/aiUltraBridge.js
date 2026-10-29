/**
 * Puente de compatibilidad hacia `server/ai/` (Puente IA v2 de Grano).
 * Conserva las exportaciones históricas para cualquier consumidor de `aiUltraBridge.js`
 * delegando la ejecución y las rutas al nuevo motor v2 basado en `agy`.
 */
// gemini CLI v0.50.0 eliminado: devuelve IneligibleTierError para cuentas individuales; se usa siempre agy

import {
  detectAgy,
  runAgyPrompt,
  classifyCliError,
  getDefaultModels,
} from './ai/agyRunner.js';
import {
  createAiRoutes,
  granoAiPlugin,
  MAX_BODY_BYTES as V2_MAX_BODY_BYTES,
} from './ai/routes.js';
import { MAX_MESSAGE_CHARS } from './ai/contextBuilder.js';

export const MAX_BODY_BYTES = V2_MAX_BODY_BYTES;
export const MAX_PROMPT_CHARS = MAX_MESSAGE_CHARS;

export { classifyCliError };

export function sanitizeErrorMessage(err) {
  const info = classifyCliError(err);
  return info.message;
}

export function detectCliTools() {
  const { hasAgy, agyBinPath } = detectAgy();
  return {
    hasGemini: false,
    geminiEntrypoint: null,
    hasAgy,
    agyBinPath,
  };
}

export async function runCliPrompt(
  cliInfo,
  _cliType,
  fullPrompt,
  timeoutMs = 120_000,
  model = getDefaultModels().fast
) {
  const res = await runAgyPrompt({
    prompt: fullPrompt,
    model,
    agyBinPath: cliInfo?.agyBinPath,
    totalTimeoutMs: timeoutMs,
  });
  return res.text;
}

export function createGoogleAiUltraMiddleware(middlewares = null) {
  const middleware = createAiRoutes();
  if (middlewares && typeof middlewares.use === 'function') {
    middlewares.use(middleware);
  }
  middleware.attach = (targetMiddlewares) => {
    if (targetMiddlewares && typeof targetMiddlewares.use === 'function') {
      targetMiddlewares.use(middleware);
    }
  };
  return middleware;
}

export function googleAiUltraBridgePlugin(options = {}) {
  return granoAiPlugin(options);
}

export default createGoogleAiUltraMiddleware;
