import {
  FeynmanRubricSchema,
  QuizMoreSchema,
  InterviewGradeSchema,
  AI_JSON_SCHEMAS,
  validateAiJsonOutput,
} from './schemas.js';

let manualSessionToken = null;

/**
 * Permite inyectar un token de sesión en tests unitarios sin depender del DOM.
 */
export function setClientSessionTokenForTests(token) {
  manualSessionToken = token;
}

/**
 * Lee el token de `<meta name="grano-session" content="...">` inyectado por el servidor en `index.html`.
 */
export function getSessionToken() {
  if (typeof manualSessionToken === 'string' && manualSessionToken.length > 0) {
    return manualSessionToken;
  }
  if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
    const meta = document.querySelector('meta[name="grano-session"]');
    const content = meta?.getAttribute('content');
    if (typeof content === 'string' && content.trim().length > 0) {
      return content.trim();
    }
  }
  return '';
}

/**
 * Construye las cabeceras HTTP incluyendo siempre `X-Grano-Session`.
 */
export function buildRequestHeaders(extraHeaders = {}) {
  const token = getSessionToken();
  const headers = {
    Accept: 'application/json, text/event-stream',
    ...extraHeaders,
  };
  if (token) {
    headers['X-Grano-Session'] = token;
  }
  return headers;
}

const ERROR_STEPS_BY_CODE = {
  AGY_NOT_FOUND: [
    'Comprueba que Antigravity esté instalado en este equipo (`where.exe agy.exe`).',
    'Si está en otra ruta, define la variable `GRANO_AGY_PATH` antes de iniciar el servidor.',
    'Ejecuta `npm run ai:check` en la terminal para verificar la detección.',
  ],
  AGY_AUTH: [
    'Abre la aplicación Antigravity en tu equipo.',
    'Inicia sesión con tu cuenta con suscripción Google AI Ultra.',
    'Vuelve aquí y pulsa Reintentar.',
  ],
  AGY_TIMEOUT: [
    'Cambia el selector de modelo a Rápido (`gemini-3.8-flash-low`).',
    'Verifica tu conexión a internet y pulsa Reintentar.',
  ],
  AGY_QUOTA: [
    'Espera unos minutos antes de enviar una nueva consulta.',
    'Prueba a cambiar al modelo Rápido (`gemini-3.8-flash-low`).',
  ],
  INVALID_SESSION: [
    'Recarga la pestaña del navegador (`F5`) para renovar el token de sesión local.',
    'Asegúrate de acceder desde `http://127.0.0.1` o `http://localhost`.',
  ],
  JSON_SCHEMA_INVALID: [
    'La respuesta del modelo no cumplió el formato estructurado tras el reintento del servidor.',
    'Pulsa Reintentar o selecciona el modelo Rápido.',
  ],
  NETWORK_ERROR: [
    'Comprueba que el servidor local (`npm run dev` o `npm start`) siga en ejecución.',
    'Verifica que estás abriendo la aplicación en `127.0.0.1` o `localhost`.',
  ],
  AGY_FAILED: [
    'Pulsa Reintentar para volver a enviar la consulta.',
    'Si el fallo persiste, ejecuta `npm run ai:check` en la terminal.',
  ],
};

/**
 * Normaliza cualquier error del servidor, de red o de validación a una estructura uniforme y honesta.
 * Nunca inventa ni devuelve respuestas pre-escritas.
 */
export function normalizeAiError(rawError) {
  if (!rawError) {
    return {
      code: 'AGY_FAILED',
      message: 'La IA no pudo responder.',
      fix: 'Reintenta. Si se repite, ejecuta `npm run ai:check`.',
      steps: ERROR_STEPS_BY_CODE.AGY_FAILED,
      aborted: false,
    };
  }

  if (
    rawError?.name === 'AbortError' ||
    rawError?.code === 'ABORTED' ||
    rawError?.aborted === true
  ) {
    return {
      code: 'ABORTED',
      message: 'Consulta detenida por el usuario.',
      fix: 'Puedes editar tu pregunta o volver a enviarla cuando quieras.',
      steps: [],
      aborted: true,
    };
  }

  const code =
    typeof rawError.code === 'string' && rawError.code.trim().length > 0
      ? rawError.code.trim()
      : 'AGY_FAILED';

  const message =
    rawError.message ||
    rawError.error ||
    (code === 'AGY_NOT_FOUND'
      ? 'No encuentro Antigravity (agy) en este equipo.'
      : 'La IA no pudo responder.');

  const fix =
    rawError.fix ||
    (code === 'AGY_NOT_FOUND'
      ? 'Instala Antigravity o define GRANO_AGY_PATH.'
      : 'Reintenta. Si se repite, ejecuta `npm run ai:check`.');

  const defaultSteps = ERROR_STEPS_BY_CODE[code] || ERROR_STEPS_BY_CODE.AGY_FAILED;
  const steps = Array.isArray(rawError.steps) && rawError.steps.length > 0
    ? rawError.steps
    : defaultSteps;

  return {
    code,
    message,
    fix,
    steps,
    validationError: rawError.validationError || undefined,
    aborted: false,
  };
}

/**
 * Parsea un bloque de evento SSE individual (`event: ...\ndata: ...`).
 */
export function parseSseEventBlock(rawBlock) {
  if (typeof rawBlock !== 'string' || !rawBlock.trim()) return null;
  const lines = rawBlock.split(/\r?\n/);
  let eventName = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  const rawData = dataLines.join('\n');
  let parsedData = rawData;
  try {
    parsedData = JSON.parse(rawData);
  } catch {
    // conservar como string si no es JSON
  }

  return {
    event: eventName,
    data: parsedData,
  };
}

/**
 * Consume un `ReadableStream` de respuesta SSE con `TextDecoder`, soportando fragmentos partidos.
 */
export async function consumeSseStream(
  readableStream,
  { onQueued, onMeta, onDelta, onDone, onError, signal } = {}
) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let accumulatedText = '';
  let firstTokenMs = null;
  let durationMs = null;
  let activeModel = null;
  let donePayload = null;
  let streamError = null;

  const processBlock = (block) => {
    const parsed = parseSseEventBlock(block);
    if (!parsed) return;
    const { event, data } = parsed;

    if (event === 'queued') {
      const position = typeof data?.position === 'number' ? data.position : 1;
      onQueued?.({ position });
      onMeta?.({ queued: true, position });
      return;
    }

    if (event === 'meta') {
      if (data?.model) activeModel = data.model;
      onMeta?.(data || {});
      return;
    }

    if (event === 'delta') {
      const chunkText = typeof data?.text === 'string' ? data.text : '';
      if (typeof data?.firstTokenMs === 'number' && firstTokenMs === null) {
        firstTokenMs = data.firstTokenMs;
      }
      if (chunkText.length > 0) {
        accumulatedText += chunkText;
        onDelta?.(chunkText, {
          text: chunkText,
          accumulatedText,
          firstTokenMs,
        });
      }
      return;
    }

    if (event === 'done') {
      if (typeof data?.firstTokenMs === 'number') {
        firstTokenMs = data.firstTokenMs;
      }
      if (typeof data?.durationMs === 'number') {
        durationMs = data.durationMs;
      }
      if (data?.model) {
        activeModel = data.model;
      }
      donePayload = {
        ...data,
        text: accumulatedText,
        firstTokenMs: firstTokenMs ?? data?.firstTokenMs ?? 0,
        durationMs: durationMs ?? data?.durationMs ?? 0,
        model: activeModel || data?.model || null,
      };
      onDone?.(donePayload);
      return;
    }

    if (event === 'error') {
      streamError = normalizeAiError(data);
      onError?.(streamError);
    }
  };

  try {
    while (true) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch {}
        throw normalizeAiError({ code: 'ABORTED', aborted: true });
      }

      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // Separar por doble salto de línea (\n\n o \r\n\r\n)
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? '';

      for (const block of parts) {
        processBlock(block);
        if (streamError) break;
      }

      if (streamError) {
        try {
          await reader.cancel();
        } catch {}
        throw streamError;
      }
    }

    buffer += decoder.decode();
    if (buffer.trim().length > 0) {
      const remaining = buffer.split(/\r?\n\r?\n/);
      for (const block of remaining) {
        processBlock(block);
      }
    }

    if (streamError) {
      throw streamError;
    }

    if (!donePayload) {
      donePayload = {
        text: accumulatedText,
        firstTokenMs: firstTokenMs ?? 0,
        durationMs: durationMs ?? 0,
        chars: accumulatedText.length,
        model: activeModel,
      };
      onDone?.(donePayload);
    }

    return {
      ok: true,
      ...donePayload,
    };
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

/**
 * Envía una consulta en streaming sobre SSE (`POST /api/ai/chat`) usando `fetch` + `ReadableStream`.
 */
export async function streamChat(
  {
    mode = 'tutor',
    lessonId,
    sectionId,
    messages,
    prompt,
    question,
    selection,
    code,
    result,
    simulatorState,
    model,
    track,
    level,
  } = {},
  { onQueued, onMeta, onDelta, onDone, onError, signal, fetchImpl = fetch } = {}
) {
  if (signal?.aborted) {
    const abortedErr = normalizeAiError({ code: 'ABORTED', aborted: true });
    onError?.(abortedErr);
    throw abortedErr;
  }

  const bodyPayload = {
    mode,
    ...(lessonId !== undefined && lessonId !== null ? { lessonId: String(lessonId) } : {}),
    ...(sectionId !== undefined && sectionId !== null ? { sectionId } : {}),
    ...(Array.isArray(messages) && messages.length > 0 ? { messages } : {}),
    ...(typeof prompt === 'string' && prompt.trim() ? { prompt: prompt.trim() } : {}),
    ...(typeof question === 'string' && question.trim() ? { question: question.trim() } : {}),
    ...(typeof selection === 'string' && selection.trim()
      ? { selection: selection.trim() }
      : {}),
    ...(typeof code === 'string' && code.trim() ? { code: code.trim() } : {}),
    ...(result !== undefined && result !== null ? { result } : {}),
    ...(simulatorState && typeof simulatorState === 'object' ? { simulatorState } : {}),
    ...(typeof model === 'string' && model.trim() ? { model: model.trim() } : {}),
    ...(typeof track === 'string' && track.trim() ? { track: track.trim() } : {}),
    ...(typeof level === 'number' && Number.isFinite(level) ? { level } : {}),
  };

  let res;
  try {
    res = await fetchImpl('/api/ai/chat', {
      method: 'POST',
      headers: buildRequestHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(bodyPayload),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      const abortedErr = normalizeAiError({ code: 'ABORTED', aborted: true });
      onError?.(abortedErr);
      throw abortedErr;
    }
    const netErr = normalizeAiError({
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor local de Grano.',
      fix: 'Comprueba que `npm run dev` o `npm start` siga en marcha y pulsa Reintentar.',
    });
    onError?.(netErr);
    throw netErr;
  }

  const contentType = (res.headers?.get?.('content-type') || '').toLowerCase();
  if (!res.ok || !contentType.includes('text/event-stream')) {
    let errData = {};
    try {
      errData = await res.json();
    } catch {}
    const normalized = normalizeAiError({
      code: errData.code || (res.status === 403 ? 'INVALID_SESSION' : 'AGY_FAILED'),
      message: errData.message || errData.error || `Error HTTP ${res.status}`,
      fix: errData.fix,
    });
    onError?.(normalized);
    throw normalized;
  }

  if (!res.body) {
    const noBodyErr = normalizeAiError({
      code: 'AGY_FAILED',
      message: 'El navegador no recibió el flujo de respuesta (ReadableStream vacío).',
    });
    onError?.(noBodyErr);
    throw noBodyErr;
  }

  try {
    return await consumeSseStream(res.body, {
      onQueued,
      onMeta,
      onDelta,
      onDone,
      onError,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError' || err?.code === 'ABORTED' || signal?.aborted) {
      const abortedErr = normalizeAiError({ code: 'ABORTED', aborted: true });
      onError?.(abortedErr);
      throw abortedErr;
    }
    const normalized = err?.code && err?.steps ? err : normalizeAiError(err);
    onError?.(normalized);
    throw normalized;
  }
}

/**
 * Solicita una respuesta estructurada JSON (`POST /api/ai/json`) y la valida con Zod en el cliente
 * para los modos `feynman`, `quiz-more` e `interview` (`interview-grade`).
 */
export async function requestAiJson({
  mode,
  lessonId,
  sectionId,
  payload = {},
  text,
  explanation,
  answer,
  question,
  code,
  model,
  track,
  level,
  signal,
  fetchImpl = fetch,
} = {}) {
  const serverMode = mode === 'interview' ? 'interview-grade' : mode;
  if (!AI_JSON_SCHEMAS[mode] && !AI_JSON_SCHEMAS[serverMode]) {
    throw normalizeAiError({
      code: 'AGY_FAILED',
      message: `Modo estructurado no soportado: ${String(mode)}`,
    });
  }

  const requestBody = {
    ...payload,
    mode: serverMode,
    ...(lessonId !== undefined && lessonId !== null ? { lessonId: String(lessonId) } : {}),
    ...(sectionId !== undefined && sectionId !== null ? { sectionId } : {}),
    ...(typeof text === 'string' ? { text } : {}),
    ...(typeof explanation === 'string' ? { explanation } : {}),
    ...(typeof answer === 'string' ? { answer } : {}),
    ...(typeof question === 'string' ? { question } : {}),
    ...(typeof code === 'string' ? { code } : {}),
    ...(typeof model === 'string' && model.trim() ? { model: model.trim() } : {}),
    ...(typeof track === 'string' && track.trim() ? { track: track.trim() } : {}),
    ...(typeof level === 'number' && Number.isFinite(level) ? { level } : {}),
  };

  let res;
  try {
    res = await fetchImpl('/api/ai/json', {
      method: 'POST',
      headers: buildRequestHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      throw normalizeAiError({ code: 'ABORTED', aborted: true });
    }
    throw normalizeAiError({
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor local de Grano.',
      fix: 'Comprueba que `npm run dev` o `npm start` siga en marcha y pulsa Reintentar.',
    });
  }

  let bodyJson = null;
  try {
    bodyJson = await res.json();
  } catch {
    throw normalizeAiError({
      code: 'JSON_SCHEMA_INVALID',
      message: 'El servidor devolvió una respuesta que no es JSON válido.',
    });
  }

  if (!res.ok || !bodyJson?.ok) {
    throw normalizeAiError({
      code:
        bodyJson?.code ||
        (bodyJson?.validationError ? 'JSON_SCHEMA_INVALID' : 'AGY_FAILED'),
      message:
        bodyJson?.message ||
        bodyJson?.error ||
        'La IA no pudo generar el formato estructurado solicitado.',
      fix: bodyJson?.fix,
      validationError: bodyJson?.validationError,
    });
  }

  // Validación Zod obligatoria en el cliente
  const validation = validateAiJsonOutput(serverMode, bodyJson.data);
  if (!validation.ok) {
    throw normalizeAiError({
      code: 'JSON_SCHEMA_INVALID',
      message: 'La respuesta del modelo no superó la validación de esquema en el cliente.',
      fix: 'Pulsa Reintentar o cambia al modelo Rápido.',
      validationError: validation.error,
    });
  }

  return {
    ok: true,
    mode: serverMode,
    model: bodyJson.model || model || null,
    data: validation.data,
    attempts: bodyJson.attempts || 1,
    durationMs: bodyJson.durationMs || 0,
  };
}

// Estado reactivo ligero del estado de conexión con `agy`
let lastKnownStatus = {
  checked: false,
  available: true,
  engine: 'agy',
  version: null,
  defaultModels: {
    fast: 'gemini-3.8-flash-low',
    deep: 'gemini-4-argon-medium',
  },
  code: null,
  message: null,
  fix: null,
  steps: [],
};

const statusListeners = new Set();

export function getStatusSnapshot() {
  return lastKnownStatus;
}

export function subscribeAiStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function updateKnownStatus(nextStatus) {
  lastKnownStatus = {
    ...lastKnownStatus,
    ...nextStatus,
    checked: true,
  };
  syncTopbarAiButtonStatus(lastKnownStatus);
  for (const listener of statusListeners) {
    try {
      listener(lastKnownStatus);
    } catch {}
  }
  return lastKnownStatus;
}

/**
 * Sincroniza el estado de disponibilidad en el botón del header (`.app-topbar__tutor-btn`)
 * y en `document.documentElement` para mostrar estado deshabilitado y tooltip informativo.
 */
export function syncTopbarAiButtonStatus(status = lastKnownStatus, aiEnabled = true) {
  if (typeof document === 'undefined') return;
  const isAvailable = Boolean(status?.available) && Boolean(aiEnabled);
  const root = document.documentElement;
  if (root) {
    root.setAttribute('data-ai-available', isAvailable ? 'true' : 'false');
  }

  const buttons = document.querySelectorAll(
    '.app-topbar__tutor-btn, .lp-mobile-tutor-btn, [data-tutor-trigger]'
  );
  const reasonText = !aiEnabled
    ? 'Tutor IA desactivado en Ajustes.'
    : !status?.available
      ? `${status?.message || 'IA no disponible.'} ${status?.fix || ''}`.trim()
      : `Tutor disponible (${status?.defaultModels?.fast || 'gemini-3.8-flash-low'})`;

  buttons.forEach((btn) => {
    if (!isAvailable) {
      btn.setAttribute('data-ai-unavailable', 'true');
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('title', reasonText);
    } else {
      btn.removeAttribute('data-ai-unavailable');
      btn.removeAttribute('aria-disabled');
      btn.setAttribute('title', reasonText);
    }
  });
}

/**
 * Consulta `GET /api/ai/status` para verificar si `agy` está disponible y autenticado.
 */
export async function getStatus({ signal, fetchImpl = fetch } = {}) {
  // Soporte para simular `AGY_NOT_FOUND` mediante query param `?ai=unavailable` o variable global en pruebas
  if (typeof window !== 'undefined') {
    const override = window.__GRANO_AI_STATUS_OVERRIDE__;
    if (override && typeof override === 'object') {
      const normalizedErr = !override.available ? normalizeAiError(override) : null;
      return updateKnownStatus({
        ok: Boolean(override.available),
        available: Boolean(override.available),
        engine: 'agy',
        version: override.version || null,
        defaultModels: override.defaultModels || lastKnownStatus.defaultModels,
        code: normalizedErr?.code || null,
        message: normalizedErr?.message || null,
        fix: normalizedErr?.fix || null,
        steps: normalizedErr?.steps || [],
      });
    }
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ai') === 'unavailable' || params.get('ai') === 'off') {
        const normalizedErr = normalizeAiError({ code: 'AGY_NOT_FOUND' });
        return updateKnownStatus({
          ok: false,
          available: false,
          engine: 'agy',
          version: null,
          defaultModels: lastKnownStatus.defaultModels,
          code: normalizedErr.code,
          message: normalizedErr.message,
          fix: normalizedErr.fix,
          steps: normalizedErr.steps,
        });
      }
    } catch {}
  }

  try {
    const res = await fetchImpl('/api/ai/status', {
      method: 'GET',
      headers: buildRequestHeaders(),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.available === false) {
      const normalizedErr = normalizeAiError({
        code: data.code || 'AGY_NOT_FOUND',
        message: data.message || data.error,
        fix: data.fix,
      });
      return updateKnownStatus({
        ok: false,
        available: false,
        engine: data.engine || 'agy',
        version: null,
        defaultModels: data.defaultModels || lastKnownStatus.defaultModels,
        code: normalizedErr.code,
        message: normalizedErr.message,
        fix: normalizedErr.fix,
        steps: normalizedErr.steps,
      });
    }

    return updateKnownStatus({
      ok: true,
      available: true,
      engine: data.engine || 'agy',
      version: data.version || null,
      defaultModels: data.defaultModels || lastKnownStatus.defaultModels,
      code: null,
      message: null,
      fix: null,
      steps: [],
    });
  } catch (err) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      throw normalizeAiError({ code: 'ABORTED', aborted: true });
    }
    const netErr = normalizeAiError({
      code: 'NETWORK_ERROR',
      message: 'No se pudo consultar el estado del puente IA local.',
      fix: 'Verifica que el servidor local siga activo.',
    });
    return updateKnownStatus({
      ok: false,
      available: false,
      engine: 'agy',
      version: null,
      code: netErr.code,
      message: netErr.message,
      fix: netErr.fix,
      steps: netErr.steps,
    });
  }
}

/**
 * Consulta `GET /api/ai/models` para obtener la lista de modelos de `agy models`.
 */
export async function getModels({ signal, fetchImpl = fetch } = {}) {
  try {
    const res = await fetchImpl('/api/ai/models', {
      method: 'GET',
      headers: buildRequestHeaders(),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const normalized = normalizeAiError(data);
      return {
        ok: false,
        models: [],
        defaultModels: data.defaultModels || lastKnownStatus.defaultModels,
        ...normalized,
      };
    }
    return {
      ok: true,
      models: Array.isArray(data.models) ? data.models : [],
      defaultModels: data.defaultModels || lastKnownStatus.defaultModels,
    };
  } catch (err) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      throw normalizeAiError({ code: 'ABORTED', aborted: true });
    }
    const normalized = normalizeAiError({
      code: 'NETWORK_ERROR',
      message: 'No se pudo obtener la lista de modelos de Antigravity.',
    });
    return {
      ok: false,
      models: [],
      defaultModels: lastKnownStatus.defaultModels,
      ...normalized,
    };
  }
}

// ── Funciones IA especializadas para el resto de la app (Paso 7) ──

/**
 * Explica por qué falló un check o una consulta SQL (`explain-error`).
 */
export function explainError(params = {}, callbacks = {}) {
  return streamChat(
    {
      ...params,
      mode: 'explain-error',
      question:
        params.question ||
        'Explica por qué ocurrió este fallo y qué debo revisar para corregirlo.',
    },
    callbacks
  );
}

/**
 * Revisa una consulta SQL de la práctica (`review-sql`).
 */
export function reviewSql(params = {}, callbacks = {}) {
  return streamChat(
    {
      ...params,
      mode: 'review-sql',
      question:
        params.question ||
        'Revisa mi consulta SQL evaluando el grano, la legibilidad y una mejora concreta.',
    },
    callbacks
  );
}

/**
 * Evalúa una explicación escrita por el alumno con la técnica Feynman (`feynman`).
 */
export function evaluateFeynman(params = {}) {
  return requestAiJson({
    ...params,
    mode: 'feynman',
  });
}

/**
 * Solicita 3 preguntas adicionales de opción múltiple sobre la lección (`quiz-more`).
 */
export function generateExtraQuiz(params = {}) {
  return requestAiJson({
    ...params,
    mode: 'quiz-more',
  });
}

/**
 * Evalúa una respuesta del simulacro de entrevista técnica (`interview-grade`).
 */
export function evaluateInterviewAnswer(params = {}) {
  return requestAiJson({
    ...params,
    mode: 'interview-grade',
  });
}

export {
  FeynmanRubricSchema,
  QuizMoreSchema,
  InterviewGradeSchema,
  AI_JSON_SCHEMAS,
  validateAiJsonOutput,
};
