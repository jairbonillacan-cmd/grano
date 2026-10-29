import crypto from 'node:crypto';
import { z } from 'zod';
import {
  detectAgy,
  getAgyVersion,
  fetchAgyModels,
  getDefaultModels,
  resolveAndValidateModel,
  runAgyStream,
  runAgyPrompt,
  classifyCliError,
  isMockEnabled,
  FALLBACK_MODELS,
} from './agyRunner.js';
import {
  buildContextPrompt,
  cleanControlChars,
  MAX_MESSAGE_CHARS,
  MAX_HISTORY_MESSAGES,
  MAX_CODE_CHARS,
  MAX_RESULT_ROWS,
  MAX_SELECTION_CHARS,
} from './contextBuilder.js';
import { defaultAiQueue } from './queue.js';
import { getCachedResponse, setCachedResponse } from './cache.js';

export const MAX_BODY_BYTES = 32_768; // 32 KB máximo para soportar historial + código SQL
export const ALLOWED_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
export const ALLOWED_HOST_RE = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;

// Token de sesión único por proceso del servidor para proteger contra CSRF / abuso local
let activeSessionToken =
  process.env.GRANO_SESSION_TOKEN || crypto.randomBytes(24).toString('hex');

export function getSessionToken() {
  return activeSessionToken;
}

export function setSessionTokenForTests(token) {
  activeSessionToken = token;
}

/**
 * Inyecta `<meta name="grano-session" content="<token>">` dentro del `<head>` de `index.html`.
 */
export function injectSessionMeta(html, token = getSessionToken()) {
  if (typeof html !== 'string') return '';
  const metaTag = `<meta name="grano-session" content="${token}" />`;
  if (html.includes('name="grano-session"')) {
    return html.replace(
      /<meta\s+name="grano-session"\s+content="[^"]*"\s*\/?>/i,
      metaTag
    );
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `    ${metaTag}\n  </head>`);
  }
  return `${metaTag}\n${html}`;
}

/**
 * Cabeceras defensivas obligatorias en todas las respuestas JSON de la API.
 */
export function setJsonSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

/**
 * Cabeceras defensivas para respuestas SSE (`text/event-stream`).
 */
export function setSseSecurityHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

/**
 * Verifica que `Origin` y `Host` provengan exclusivamente de `127.0.0.1` o `localhost`.
 */
export function verifyOriginAndHost(req) {
  const host = req.headers?.['host'];
  if (typeof host === 'string' && host.length > 0 && !ALLOWED_HOST_RE.test(host)) {
    return { ok: false, status: 403, code: 'FORBIDDEN_HOST', error: 'Host Not Allowed' };
  }

  const origin = req.headers?.['origin'];
  if (
    typeof origin === 'string' &&
    origin.length > 0 &&
    !ALLOWED_ORIGIN_RE.test(origin)
  ) {
    return {
      ok: false,
      status: 403,
      code: 'FORBIDDEN_ORIGIN',
      error: 'Origin Not Allowed',
    };
  }

  return { ok: true };
}

/**
 * Verifica la cabecera `X-Grano-Session` contra el token de sesión del servidor.
 */
export function verifySessionHeader(req, expectedToken = getSessionToken(), { required = true } = {}) {
  const headerVal = req.headers?.['x-grano-session'];
  if (!headerVal) {
    if (!required) return { ok: true };
    return {
      ok: false,
      status: 403,
      code: 'INVALID_SESSION',
      error: 'Falta la cabecera de sesión X-Grano-Session.',
    };
  }
  if (typeof headerVal !== 'string' || headerVal !== expectedToken) {
    return {
      ok: false,
      status: 403,
      code: 'INVALID_SESSION',
      error: 'Token de sesión X-Grano-Session no válido.',
    };
  }
  return { ok: true };
}

// ── Esquemas Zod de entrada (C.3) ──────────────────────────────

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z
    .string()
    .transform((s) => cleanControlChars(s))
    .refine((s) => s.length >= 1, 'El mensaje no puede estar vacío.')
    .refine(
      (s) => s.length <= MAX_MESSAGE_CHARS,
      `Cada mensaje no puede superar ${MAX_MESSAGE_CHARS} caracteres.`
    ),
});

export const ChatPayloadSchema = z
  .object({
    mode: z
      .enum([
        'tutor',
        'explain-section',
        'explain-error',
        'review-sql',
        'interview',
        'glossary',
      ])
      .default('tutor'),
    lessonId: z.string().max(120).optional(),
    sectionId: z.union([z.string().max(120), z.number().int().min(0).max(200)]).optional(),
    messages: z
      .array(ChatMessageSchema)
      .min(1, 'El historial debe incluir al menos un mensaje.')
      .max(
        MAX_HISTORY_MESSAGES,
        `El historial no puede superar ${MAX_HISTORY_MESSAGES} mensajes.`
      )
      .optional(),
    prompt: z
      .string()
      .transform((s) => cleanControlChars(s))
      .refine(
        (s) => s.length <= MAX_MESSAGE_CHARS,
        `La consulta supera el límite máximo de ${MAX_MESSAGE_CHARS} caracteres.`
      )
      .optional(),
    question: z
      .string()
      .transform((s) => cleanControlChars(s))
      .refine(
        (s) => s.length <= MAX_MESSAGE_CHARS,
        `La pregunta supera el límite máximo de ${MAX_MESSAGE_CHARS} caracteres.`
      )
      .optional(),
    selection: z.string().max(MAX_SELECTION_CHARS).optional(),
    code: z
      .string()
      .max(MAX_CODE_CHARS, `El código no puede superar ${MAX_CODE_CHARS} caracteres.`)
      .optional(),
    result: z
      .any()
      .superRefine((val, ctx) => {
        if (val === undefined || val === null) return;
        if (typeof val === 'string') {
          if (val.length > 8000) {
            ctx.addIssue({
              code: 'custom',
              message: 'El resultado en texto no puede superar 8000 caracteres.',
            });
          }
          return;
        }
        if (Array.isArray(val)) {
          if (val.length > MAX_RESULT_ROWS) {
            ctx.addIssue({
              code: 'custom',
              message: `El resultado no puede superar ${MAX_RESULT_ROWS} filas.`,
            });
          }
          return;
        }
        if (typeof val !== 'object') {
          ctx.addIssue({
            code: 'custom',
            message: 'Formato de result no válido.',
          });
        }
      })
      .optional(),
    simulatorState: z.record(z.string(), z.any()).nullable().optional(),
    model: z.string().max(64).optional(),
    track: z.enum(['core', 'de', 'da', 'bi', 'DE', 'DA', 'BI']).optional(),
    level: z.number().int().min(0).max(4).optional(),
  })
  .refine(
    (data) =>
      (Array.isArray(data.messages) && data.messages.length > 0) ||
      Boolean(data.prompt && data.prompt.trim().length > 0) ||
      Boolean(data.question && data.question.trim().length > 0) ||
      data.mode === 'explain-section',
    {
      message: 'Debes enviar `messages` (1..12) o `prompt`/`question` no vacío.',
    }
  );

export const JsonPayloadSchema = z
  .object({
    mode: z.enum(['feynman', 'quiz-more', 'interview-grade']),
    lessonId: z.string().max(120).optional(),
    sectionId: z.union([z.string().max(120), z.number().int().min(0).max(200)]).optional(),
    text: z.string().max(MAX_MESSAGE_CHARS).optional(),
    explanation: z.string().max(MAX_MESSAGE_CHARS).optional(),
    answer: z.string().max(MAX_MESSAGE_CHARS).optional(),
    question: z.string().max(MAX_MESSAGE_CHARS).optional(),
    code: z.string().max(MAX_CODE_CHARS).optional(),
    model: z.string().max(64).optional(),
    track: z.enum(['core', 'de', 'da', 'bi', 'DE', 'DA', 'BI']).optional(),
    level: z.number().int().min(0).max(4).optional(),
  })
  .refine(
    (data) => {
      if (data.mode === 'quiz-more') return true;
      const candidate =
        data.text || data.explanation || data.answer || data.question || '';
      return cleanControlChars(candidate).length > 0;
    },
    {
      message:
        'Para feynman e interview-grade es obligatorio enviar el texto o respuesta a evaluar.',
    }
  );

// ── Esquemas Zod de salida estructurada (/api/ai/json) ─────────

export const FeynmanOutputSchema = z.object({
  score: z.number().int().min(0).max(4),
  aciertos: z.array(z.string().min(1)).min(1).max(8),
  huecos: z.array(z.string()).max(8),
  siguientePaso: z.string().min(1).max(800),
});

export const QuizMoreOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        prompt: z.string().min(1),
        options: z
          .array(
            z.object({
              id: z.string().min(1),
              text: z.string().min(1),
              correct: z.boolean(),
              feedback: z.string().min(1),
            })
          )
          .min(3)
          .max(4)
          .refine(
            (opts) => opts.filter((o) => o.correct).length === 1,
            'Cada pregunta debe tener exactamente una opción con correct: true.'
          ),
        explanation: z.string().min(1),
      })
    )
    .min(1)
    .max(5),
});

export const InterviewGradeOutputSchema = z.object({
  score: z.number().int().min(0).max(4),
  fortalezas: z.array(z.string().min(1)).min(1).max(8),
  mejoras: z.array(z.string()).max(8),
  respuestaModelo: z.string().min(1).max(1500),
  siguientePregunta: z.string().optional(),
});

export const JSON_OUTPUT_SCHEMAS = {
  feynman: FeynmanOutputSchema,
  'quiz-more': QuizMoreOutputSchema,
  'interview-grade': InterviewGradeOutputSchema,
};

/**
 * Extrae y parsea un bloque JSON desde la salida de texto del modelo.
 */
export function extractJsonFromText(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('Respuesta vacía del modelo.');
  }
  const trimmed = rawText.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('No se encontró un objeto JSON válido en la respuesta.');
  }
}

/**
 * Valida el payload de `/api/ai/chat`.
 */
export function validateChatPayload(rawBody) {
  if (typeof rawBody !== 'object' || rawBody === null || Array.isArray(rawBody)) {
    return {
      valid: false,
      status: 400,
      error: 'El cuerpo de la solicitud debe ser un objeto JSON válido.',
    };
  }
  const parsed = ChatPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    return {
      valid: false,
      status: 400,
      error: firstIssue?.message || 'Solicitud inválida para /api/ai/chat.',
    };
  }

  const data = parsed.data;
  const messages = Array.isArray(data.messages) && data.messages.length > 0
    ? data.messages
    : [
        {
          role: 'user',
          content:
            data.prompt ||
            data.question ||
            'Explícame esta sección con otro ejemplo.',
        },
      ];

  return {
    valid: true,
    data: {
      ...data,
      messages,
    },
  };
}

/**
 * Valida el payload de `/api/ai/json`.
 */
export function validateJsonPayload(rawBody) {
  if (typeof rawBody !== 'object' || rawBody === null || Array.isArray(rawBody)) {
    return {
      valid: false,
      status: 400,
      error: 'El cuerpo de la solicitud debe ser un objeto JSON válido.',
    };
  }
  const parsed = JsonPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    return {
      valid: false,
      status: 400,
      error: firstIssue?.message || 'Solicitud inválida para /api/ai/json.',
    };
  }
  return { valid: true, data: parsed.data };
}

/**
 * Lee el cuerpo JSON de una petición HTTP con límite estricto de bytes.
 */
function readJsonBody(req, res, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve) => {
    const contentType = req.headers?.['content-type'] || '';
    if (contentType && !contentType.toLowerCase().includes('application/json')) {
      setJsonSecurityHeaders(res);
      res.statusCode = 415;
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Unsupported Media Type: se requiere application/json',
        })
      );
      resolve(null);
      return;
    }

    let receivedBytes = 0;
    let abortedForSize = false;
    const chunks = [];

    req.on('data', (chunk) => {
      if (abortedForSize) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8');
      receivedBytes += buf.byteLength;

      if (receivedBytes > maxBytes) {
        abortedForSize = true;
        setJsonSecurityHeaders(res);
        res.statusCode = 413;
        res.end(
          JSON.stringify({
            ok: false,
            error: `El cuerpo de la solicitud supera el límite máximo de ${maxBytes} bytes.`,
          })
        );
        try {
          req.destroy();
        } catch {}
        resolve(null);
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (abortedForSize || res.writableEnded) {
        resolve(null);
        return;
      }
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        const parsed = JSON.parse(rawBody || '{}');
        resolve(parsed);
      } catch {
        setJsonSecurityHeaders(res);
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Formato JSON inválido.' }));
        resolve(null);
      }
    });

    req.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Conecta un `AbortController` al cierre real de la conexión por parte del cliente.
 */
function attachClientDisconnectAbort(req, res) {
  const abortController = new AbortController();
  const triggerAbort = () => {
    if (!res.writableEnded && !abortController.signal.aborted) {
      abortController.abort();
    }
  };

  res.on('close', triggerAbort);
  req.on('aborted', triggerAbort);
  if (req.socket && typeof req.socket.on === 'function') {
    req.socket.on('close', triggerAbort);
  } else {
    // En tests unitarios con req simulado sin socket, escuchar req.close tras el turno de lectura
    setImmediate(() => {
      if (!res.writableEnded) {
        req.on('close', triggerAbort);
      }
    });
  }

  return abortController;
}

/**
 * Crea el enrutador de `/api/ai/*` (status, models, chat SSE, json con Zod + 1 reintento, y query legacy).
 */
export function createAiRoutes({
  queue = defaultAiQueue,
  spawnImpl,
  cacheDir,
  sessionToken,
} = {}) {
  const getToken = () => sessionToken || getSessionToken();

  // 1. GET /api/ai/status
  const handleStatus = (req, res) => {
    setJsonSecurityHeaders(res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
      return;
    }

    const originCheck = verifyOriginAndHost(req);
    if (!originCheck.ok) {
      res.statusCode = originCheck.status;
      res.end(JSON.stringify({ ok: false, error: originCheck.error }));
      return;
    }

    const defaultModels = getDefaultModels();
    const detected = detectAgy();

    if (!detected.hasAgy && !(isMockEnabled() && !process.env.GRANO_AGY_PATH)) {
      const notFound = classifyCliError({ code: 'AGY_NOT_FOUND' });
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: false,
          available: false,
          engine: 'agy',
          version: null,
          defaultModels,
          models: defaultModels,
          cli: { gemini: false, agy: false },
          code: notFound.code,
          message: notFound.message,
          fix: notFound.fix,
        })
      );
      return;
    }

    const version = detected.hasAgy ? getAgyVersion(detected.agyBinPath) : 'mock';
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        available: true,
        engine: 'agy',
        version,
        defaultModels,
        models: defaultModels,
        cli: { gemini: false, agy: true },
        security: {
          shellExecution: false,
          maxBodyBytes: MAX_BODY_BYTES,
          maxPromptChars: MAX_MESSAGE_CHARS,
        },
      })
    );
  };

  // 2. GET /api/ai/models
  const handleModels = async (req, res) => {
    setJsonSecurityHeaders(res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
      return;
    }

    const originCheck = verifyOriginAndHost(req);
    if (!originCheck.ok) {
      res.statusCode = originCheck.status;
      res.end(JSON.stringify({ ok: false, error: originCheck.error }));
      return;
    }

    try {
      const { models } = await fetchAgyModels({ spawnImpl });
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          models,
          defaultModels: getDefaultModels(),
        })
      );
    } catch (err) {
      const info = classifyCliError(err);
      res.statusCode = info.code === 'AGY_NOT_FOUND' ? 503 : 502;
      res.end(
        JSON.stringify({
          ok: false,
          models: [],
          ...info,
        })
      );
    }
  };

  // 3. POST /api/ai/chat (SSE: queued, meta, delta, done, error)
  const handleChat = async (req, res) => {
    if (req.method !== 'POST') {
      setJsonSecurityHeaders(res);
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
      return;
    }

    const originCheck = verifyOriginAndHost(req);
    if (!originCheck.ok) {
      setJsonSecurityHeaders(res);
      res.statusCode = originCheck.status;
      res.end(JSON.stringify({ ok: false, error: originCheck.error }));
      return;
    }

    const sessionCheck = verifySessionHeader(req, getToken(), { required: true });
    if (!sessionCheck.ok) {
      setJsonSecurityHeaders(res);
      res.statusCode = sessionCheck.status;
      res.end(
        JSON.stringify({
          ok: false,
          code: sessionCheck.code,
          error: sessionCheck.error,
        })
      );
      return;
    }

    const rawBody = await readJsonBody(req, res, MAX_BODY_BYTES);
    if (!rawBody) return;

    const validation = validateChatPayload(rawBody);
    if (!validation.valid) {
      setJsonSecurityHeaders(res);
      res.statusCode = validation.status;
      res.end(JSON.stringify({ ok: false, error: validation.error }));
      return;
    }

    const payload = validation.data;

    let allowedModels = FALLBACK_MODELS;
    try {
      const fetched = await fetchAgyModels({ spawnImpl });
      if (Array.isArray(fetched.models) && fetched.models.length > 0) {
        allowedModels = fetched.models;
      }
    } catch {}

    let resolvedModel;
    try {
      resolvedModel = resolveAndValidateModel(payload.model, allowedModels);
    } catch (modelErr) {
      setJsonSecurityHeaders(res);
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          ok: false,
          code: 'INVALID_MODEL',
          error: modelErr.message,
        })
      );
      return;
    }

    const { prompt: fullPrompt, context } = await buildContextPrompt({
      mode: payload.mode,
      lessonId: payload.lessonId,
      sectionId: payload.sectionId,
      messages: payload.messages,
      selection: payload.selection,
      code: payload.code,
      result: payload.result,
      simulatorState: payload.simulatorState,
      track: payload.track,
      level: payload.level,
    });

    const abortController = attachClientDisconnectAbort(req, res);

    res.statusCode = 200;
    setSseSecurityHeaders(res);
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const sendSse = (event, data) => {
      if (res.writableEnded || abortController.signal.aborted) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Comprobar caché en `.cache/ai/` para modos sin datos personales (explain-section, glossary)
    const cacheParams = {
      mode: payload.mode,
      lessonId: context.lessonId,
      sectionId: context.sectionId,
      model: resolvedModel,
      contentVersion: context.contentVersion,
    };

    const cached = getCachedResponse(
      {
        ...cacheParams,
        selection: payload.selection,
        code: payload.code,
        result: payload.result,
        messages: payload.messages,
      },
      { cacheDir }
    );

    if (cached) {
      sendSse('meta', {
        model: resolvedModel,
        startedAt: Date.now(),
        cached: true,
      });
      sendSse('delta', { text: cached.response, firstTokenMs: 0 });
      sendSse('done', {
        durationMs: 0,
        firstTokenMs: 0,
        chars: cached.response.length,
        model: resolvedModel,
        cached: true,
      });
      res.end();
      return;
    }

    try {
      await queue.enqueue(
        async () => {
          const result = await runAgyStream({
            prompt: fullPrompt,
            model: resolvedModel,
            allowedModels,
            signal: abortController.signal,
            spawnImpl,
            onMeta: (meta) => {
              sendSse('meta', {
                model: meta.model,
                startedAt: meta.startedAt,
              });
            },
            onDelta: (textChunk, info) => {
              sendSse('delta', {
                text: textChunk,
                firstTokenMs: info?.firstTokenMs,
              });
            },
            onDone: (doneInfo) => {
              setCachedResponse(
                {
                  ...cacheParams,
                  selection: payload.selection,
                  code: payload.code,
                  result: payload.result,
                  messages: payload.messages,
                },
                doneInfo.text,
                { cacheDir }
              );
              sendSse('done', {
                durationMs: doneInfo.durationMs,
                firstTokenMs: doneInfo.firstTokenMs,
                chars: doneInfo.chars,
                model: doneInfo.model,
              });
            },
          });
          return result;
        },
        {
          signal: abortController.signal,
          onQueued: ({ position }) => {
            sendSse('queued', { position });
          },
        }
      );
      if (!res.writableEnded) {
        res.end();
      }
    } catch (err) {
      if (err?.code === 'ABORTED' || abortController.signal.aborted) {
        if (!res.writableEnded) {
          res.end();
        }
        return;
      }
      const info = classifyCliError(err);
      sendSse('error', {
        code: info.code,
        message: info.message,
        fix: info.fix,
      });
      if (!res.writableEnded) {
        res.end();
      }
    }
  };

  // 4. POST /api/ai/json (feynman, quiz-more, interview-grade con validación Zod y 1 reintento)
  const handleJson = async (req, res) => {
    setJsonSecurityHeaders(res);

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
      return;
    }

    const originCheck = verifyOriginAndHost(req);
    if (!originCheck.ok) {
      res.statusCode = originCheck.status;
      res.end(JSON.stringify({ ok: false, error: originCheck.error }));
      return;
    }

    const sessionCheck = verifySessionHeader(req, getToken(), { required: true });
    if (!sessionCheck.ok) {
      res.statusCode = sessionCheck.status;
      res.end(
        JSON.stringify({
          ok: false,
          code: sessionCheck.code,
          error: sessionCheck.error,
        })
      );
      return;
    }

    const rawBody = await readJsonBody(req, res, MAX_BODY_BYTES);
    if (!rawBody) return;

    const validation = validateJsonPayload(rawBody);
    if (!validation.valid) {
      res.statusCode = validation.status;
      res.end(JSON.stringify({ ok: false, error: validation.error }));
      return;
    }

    const payload = validation.data;
    const outputSchema = JSON_OUTPUT_SCHEMAS[payload.mode];

    let allowedModels = FALLBACK_MODELS;
    try {
      const fetched = await fetchAgyModels({ spawnImpl });
      if (Array.isArray(fetched.models) && fetched.models.length > 0) {
        allowedModels = fetched.models;
      }
    } catch {}

    let resolvedModel;
    try {
      resolvedModel = resolveAndValidateModel(payload.model, allowedModels);
    } catch (modelErr) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          ok: false,
          code: 'INVALID_MODEL',
          error: modelErr.message,
        })
      );
      return;
    }

    const userText =
      payload.text ||
      payload.explanation ||
      payload.answer ||
      payload.question ||
      'Genera las 3 preguntas en formato JSON.';

    const { prompt: basePrompt } = await buildContextPrompt({
      mode: payload.mode,
      lessonId: payload.lessonId,
      sectionId: payload.sectionId,
      question: userText,
      code: payload.code,
      track: payload.track,
      level: payload.level,
    });

    const abortController = attachClientDisconnectAbort(req, res);

    try {
      const executeAttempt = async (promptToRun) =>
        queue.enqueue(
          () =>
            runAgyPrompt({
              prompt: promptToRun,
              model: resolvedModel,
              allowedModels,
              signal: abortController.signal,
              spawnImpl,
              jsonMode: payload.mode,
            }),
          { signal: abortController.signal }
        );

      let lastValidationError = '';
      for (let attempt = 1; attempt <= 2; attempt++) {
        const promptForAttempt =
          attempt === 1
            ? basePrompt
            : `${basePrompt}\n\nIMPORTANTE (reintento): Tu respuesta anterior no cumplió el esquema JSON requerido (${lastValidationError}). Devuelve ÚNICAMENTE un objeto JSON válido sin bloques Markdown ni texto adicional.`;

        const runResult = await executeAttempt(promptForAttempt);

        try {
          const rawJson = extractJsonFromText(runResult.text);
          const validated = outputSchema.safeParse(rawJson);
          if (validated.success) {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                ok: true,
                mode: payload.mode,
                model: resolvedModel,
                data: validated.data,
                attempts: attempt,
                durationMs: runResult.durationMs,
              })
            );
            return;
          }
          lastValidationError =
            validated.error.issues?.[0]?.message || 'Esquema JSON inválido';
        } catch (parseErr) {
          lastValidationError = parseErr.message || 'JSON mal formado';
        }
      }

      // Si tras 1 reintento sigue sin validar, devolver error honesto C.6
      const failedInfo = classifyCliError(new Error('JSON_SCHEMA_INVALID'));
      res.statusCode = 502;
      res.end(
        JSON.stringify({
          ok: false,
          ...failedInfo,
          validationError: lastValidationError,
        })
      );
    } catch (err) {
      if (err?.code === 'ABORTED' || abortController.signal.aborted) {
        if (!res.writableEnded) res.end();
        return;
      }
      const info = classifyCliError(err);
      res.statusCode = info.code === 'AGY_NOT_FOUND' ? 503 : 502;
      res.end(JSON.stringify({ ok: false, ...info }));
    }
  };

  // 5. POST /api/ai/query (Compatibilidad legacy para src/App.jsx hasta que T11 migre a /api/ai/chat)
  const handleLegacyQuery = async (req, res) => {
    setJsonSecurityHeaders(res);

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
      return;
    }

    const originCheck = verifyOriginAndHost(req);
    if (!originCheck.ok) {
      res.statusCode = originCheck.status;
      res.end(JSON.stringify({ ok: false, error: originCheck.error }));
      return;
    }

    // Si el cliente envía X-Grano-Session, verificarlo; si no, permitir mientras App.jsx sea legacy
    const sessionCheck = verifySessionHeader(req, getToken(), { required: false });
    if (!sessionCheck.ok) {
      res.statusCode = sessionCheck.status;
      res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
      return;
    }

    const rawBody = await readJsonBody(req, res, 16_384);
    if (!rawBody) return;

    if (typeof rawBody.prompt !== 'string') {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          ok: false,
          error: 'El campo "prompt" debe ser una cadena de texto.',
        })
      );
      return;
    }

    const promptText = cleanControlChars(rawBody.prompt);
    if (promptText.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: 'La consulta no puede estar vacía.' }));
      return;
    }
    if (promptText.length > MAX_MESSAGE_CHARS) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          ok: false,
          error: `La consulta supera el límite máximo de ${MAX_MESSAGE_CHARS} caracteres.`,
        })
      );
      return;
    }

    const engineMode = rawBody.engineMode === 'deep' ? 'deep' : 'fast';
    const resolvedModel = resolveAndValidateModel(engineMode);

    const { prompt: fullPrompt } = await buildContextPrompt({
      mode: 'tutor',
      lessonId: rawBody.lessonId,
      moduleTitle: typeof rawBody.moduleTitle === 'string' ? rawBody.moduleTitle : '',
      sectionId: rawBody.sectionId,
      question: promptText,
      code: typeof rawBody.sqlCode === 'string' ? rawBody.sqlCode : '',
      simulatorState:
        rawBody.simulatorState && typeof rawBody.simulatorState === 'object'
          ? rawBody.simulatorState
          : null,
    });

    const abortController = attachClientDisconnectAbort(req, res);
    const startedAt = Date.now();

    try {
      const result = await queue.enqueue(
        () =>
          runAgyPrompt({
            prompt: fullPrompt,
            model: resolvedModel,
            signal: abortController.signal,
            spawnImpl,
          }),
        { signal: abortController.signal }
      );

      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          source: `Google AI Ultra · ${resolvedModel}`,
          model: resolvedModel,
          answer: result.text,
          elapsedMs: Date.now() - startedAt,
          firstTokenMs: result.firstTokenMs,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      if (err?.code === 'ABORTED' || abortController.signal.aborted) {
        if (!res.writableEnded) res.end();
        return;
      }
      const info = classifyCliError(err);
      res.statusCode = info.code === 'AGY_NOT_FOUND' ? 503 : 502;
      res.end(JSON.stringify({ ok: false, ...info, error: info.message }));
    }
  };

  const middleware = (req, res, next) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname === '/api/ai/status') {
      handleStatus(req, res);
      return true;
    }
    if (pathname === '/api/ai/models') {
      handleModels(req, res);
      return true;
    }
    if (pathname === '/api/ai/chat') {
      handleChat(req, res);
      return true;
    }
    if (pathname === '/api/ai/json') {
      handleJson(req, res);
      return true;
    }
    if (pathname === '/api/ai/query') {
      handleLegacyQuery(req, res);
      return true;
    }
    if (typeof next === 'function') {
      next();
    }
    return false;
  };

  middleware.handleStatus = handleStatus;
  middleware.handleModels = handleModels;
  middleware.handleChat = handleChat;
  middleware.handleJson = handleJson;
  middleware.handleQuery = handleLegacyQuery;
  middleware.getSessionToken = getToken;

  return middleware;
}

/**
 * Plugin de Vite que inyecta `<meta name="grano-session">` en `index.html`
 * y monta todas las rutas de `/api/ai/*` tanto en `vite dev` como en `vite preview`.
 */
export function granoAiPlugin(options = {}) {
  const middleware = createAiRoutes(options);

  // Calentar caché de modelos en segundo plano sin bloquear el arranque
  fetchAgyModels().catch(() => {});

  return {
    name: 'grano-ai-bridge-v2',
    transformIndexHtml(html) {
      return injectSessionMeta(html, middleware.getSessionToken());
    },
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default createAiRoutes;
