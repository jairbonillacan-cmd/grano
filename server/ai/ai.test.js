import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

import {
  buildAgyArgs,
  resolveAndValidateModel,
  classifyCliError,
  runAgyStream,
  fetchAgyModels,
  resetModelsCache,
  detectAgy,
} from './agyRunner.js';
import {
  buildContextPrompt,
  resolveLessonContext,
  MAX_TOTAL_PROMPT_CHARS,
} from './contextBuilder.js';
import {
  buildCacheKey,
  isCacheableRequest,
  getCachedResponse,
  setCachedResponse,
  CACHE_TTL_MS,
} from './cache.js';
import { AiQueue } from './queue.js';
import {
  validateChatPayload,
  validateJsonPayload,
  verifyOriginAndHost,
  verifySessionHeader,
  injectSessionMeta,
  createAiRoutes,
} from './routes.js';

/**
 * Crea un proceso hijo simulado (`ChildProcess`) para probar `agyRunner` sin ejecutar el binario real.
 */
function createFakeSpawn(behaviorFn) {
  const calls = [];
  const spawnImpl = (command, args, options) => {
    const child = new EventEmitter();
    child.pid = 42420 + calls.length;
    child.killed = false;
    child.killSignal = null;
    child.stdinData = '';

    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = new EventEmitter();
    child.stdin.write = (chunk) => {
      child.stdinData += String(chunk);
    };
    child.stdin.end = (chunk) => {
      if (chunk) child.stdinData += String(chunk);
      child.emit('stdin-ended', child.stdinData);
    };

    child.kill = (sig = 'SIGTERM') => {
      child.killed = true;
      child.killSignal = sig;
      child.emit('killed', sig);
      setImmediate(() => child.emit('close', null));
    };

    const callRecord = { command, args, options, child };
    calls.push(callRecord);

    setImmediate(() => {
      behaviorFn(callRecord);
    });

    return child;
  };
  spawnImpl.calls = calls;
  return spawnImpl;
}

describe('Puente IA v2 (server/ai)', () => {
  beforeEach(() => {
    resetModelsCache();
    delete process.env.GRANO_AI_MOCK;
    delete process.env.GRANO_AGY_PATH;
  });

  afterEach(() => {
    delete process.env.GRANO_AI_MOCK;
    delete process.env.GRANO_AGY_PATH;
  });

  // ── 1. Construcción y validación de argumentos ─────────────────
  it('1. buildAgyArgs construye solo flags seguros y nunca incluye --, --mode ni --dangerously-skip-permissions', () => {
    const args = buildAgyArgs('gemini-3.8-flash-low');
    expect(args).toEqual([
      '--model',
      'gemini-3.8-flash-low',
      '--sandbox',
      '--disable-slash-commands',
    ]);
    expect(args).not.toContain('--');
    expect(args).not.toContain('--mode');
    expect(args).not.toContain('plan');
    expect(args).not.toContain('--dangerously-skip-permissions');
    expect(args).not.toContain('--add-dir');
  });

  it('2. buildAgyArgs rechaza modelos malformados o intentos de inyección de flags', () => {
    expect(() => buildAgyArgs('')).toThrow();
    expect(() => buildAgyArgs('--dangerously-skip-permissions')).toThrow();
    expect(() => buildAgyArgs('gemini-3.8-flash-low; rm -rf /')).toThrow();
    expect(() => buildAgyArgs('../evil')).toThrow();
  });

  it('3. resolveAndValidateModel traduce fast/deep y valida contra la lista de agy models', () => {
    const list = [
      { id: 'gemini-3.8-flash-low', label: 'Flash Low' },
      { id: 'gemini-4-argon-medium', label: 'Argon Medium' },
    ];
    expect(resolveAndValidateModel('fast', list)).toBe('gemini-3.8-flash-low');
    expect(resolveAndValidateModel('deep', list)).toBe('gemini-4-argon-medium');
    expect(resolveAndValidateModel('gemini-3.8-flash-low', list)).toBe(
      'gemini-3.8-flash-low'
    );
    expect(() => resolveAndValidateModel('modelo-inexistente-99', list)).toThrow(
      /no figura en la lista/i
    );
  });

  // ── 2. Validación de payloads y límites C.3 ────────────────────
  it('4. validateChatPayload acepta un payload válido y limpia caracteres de control', () => {
    const res = validateChatPayload({
      mode: 'tutor',
      lessonId: 'l1-joins-fanout',
      sectionId: '0',
      messages: [{ role: 'user', content: '¿Qué es el \x00grano de una tabla?' }],
    });
    expect(res.valid).toBe(true);
    expect(res.data.messages[0].content).toBe('¿Qué es el grano de una tabla?');
  });

  it('5. validateChatPayload rechaza mensajes de más de 2 000 caracteres', () => {
    const res = validateChatPayload({
      mode: 'tutor',
      messages: [{ role: 'user', content: 'a'.repeat(2001) }],
    });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toMatch(/2000 caracteres/);
  });

  it('6. validateChatPayload rechaza historiales de más de 12 mensajes', () => {
    const messages = Array.from({ length: 13 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Mensaje ${i + 1}`,
    }));
    const res = validateChatPayload({ mode: 'tutor', messages });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toMatch(/12 mensajes/);
  });

  it('7. validateChatPayload rechaza código SQL de más de 4 000 caracteres', () => {
    const res = validateChatPayload({
      mode: 'review-sql',
      messages: [{ role: 'user', content: 'Revisa mi consulta' }],
      code: 'SELECT 1;\n'.repeat(450),
    });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toMatch(/4000 caracteres/);
  });

  it('8. validateChatPayload rechaza resultados con más de 50 filas', () => {
    const rows = Array.from({ length: 51 }, (_, i) => ({ id: i }));
    const res = validateChatPayload({
      mode: 'explain-error',
      messages: [{ role: 'user', content: 'Explica el resultado' }],
      result: rows,
    });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toMatch(/50 filas/);
  });

  it('9. validateJsonPayload valida feynman, quiz-more e interview-grade', () => {
    const badFeynman = validateJsonPayload({ mode: 'feynman', text: '   ' });
    expect(badFeynman.valid).toBe(false);

    const goodFeynman = validateJsonPayload({
      mode: 'feynman',
      lessonId: 'l1-joins-fanout',
      text: 'El grano es lo que representa una fila en la tabla orders.',
    });
    expect(goodFeynman.valid).toBe(true);

    const goodQuiz = validateJsonPayload({
      mode: 'quiz-more',
      lessonId: 'l1-joins-fanout',
    });
    expect(goodQuiz.valid).toBe(true);
  });

  // ── 3. ContextBuilder y recorte a ≤ 24 000 caracteres ──────────
  it('10. resolveLessonContext y buildContextPrompt cargan la lección desde src/data/ sin que el cliente envíe el texto', async () => {
    const ctx = await resolveLessonContext({
      lessonId: 'l1-joins-fanout',
      sectionId: 0,
      track: 'de',
    });
    expect(ctx.lessonTitle).toMatch(/fan-out/i);
    expect(ctx.trackName).toBe('Ingeniería de Datos');
    expect(ctx.sectionBody.length).toBeGreaterThan(50);

    const built = await buildContextPrompt({
      mode: 'tutor',
      lessonId: 'l1-joins-fanout',
      sectionId: 0,
      messages: [{ role: 'user', content: '¿Por qué se duplica order_total_usd?' }],
    });
    expect(built.prompt).toContain(ctx.lessonTitle);
    expect(built.prompt).toContain('Mercado Brisa');
    expect(built.prompt).toContain('¿Por qué se duplica order_total_usd?');
  });

  it('11. buildContextPrompt recorta el historial antiguo primero cuando supera el límite de caracteres', async () => {
    const longHistory = Array.from({ length: 12 }, (_, idx) => ({
      role: idx % 2 === 0 ? 'user' : 'assistant',
      content: `[MSG_${idx}] ` + 'x'.repeat(1950),
    }));

    // Usamos un límite ajustado y también probamos el tope de 24 000 chars
    const builtCustomLimit = await buildContextPrompt({
      mode: 'tutor',
      lessonId: 'l1-joins-fanout',
      sectionId: 0,
      messages: longHistory,
      maxTotalChars: 8000,
    });

    expect(builtCustomLimit.prompt.length).toBeLessThanOrEqual(8000);
    expect(builtCustomLimit.trimmedHistoryCount).toBeGreaterThan(0);
    // El mensaje más antiguo [MSG_0] se recortó primero, mientras que la pregunta final [MSG_11] sigue presente
    expect(builtCustomLimit.prompt).not.toContain('[MSG_0]');
    expect(builtCustomLimit.prompt).toContain('[MSG_11]');
  });

  it('12. buildContextPrompt nunca supera 24 000 caracteres incluso con sección, código y resultado enormes', async () => {
    const hugeLesson = {
      id: 'huge-lesson',
      title: 'Lección de prueba masiva',
      level: 2,
      goal: 'Objetivo de prueba',
      sections: [
        {
          id: 's1',
          heading: 'Sección gigante',
          body: 'Contenido técnico de referencia. '.repeat(1200),
        },
      ],
    };

    const built = await buildContextPrompt({
      mode: 'tutor',
      customLesson: hugeLesson,
      messages: Array.from({ length: 12 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Turno ${i}: ` + 'z'.repeat(1980),
      })),
      code: 'SELECT * FROM orders;\n'.repeat(180),
      result: 'Fila de salida\n'.repeat(250),
    });

    expect(built.prompt.length).toBeLessThanOrEqual(MAX_TOTAL_PROMPT_CHARS);
  });

  // ── 4. Caché SHA-256 (.cache/ai/) ──────────────────────────────
  it('13. buildCacheKey genera un hash SHA-256 determinista sensible a contentVersion y modelo', () => {
    const k1 = buildCacheKey({
      mode: 'explain-section',
      lessonId: 'l1-joins-fanout',
      sectionId: '0',
      model: 'gemini-3.8-flash-low',
      contentVersion: 1,
    });
    const k2 = buildCacheKey({
      mode: 'explain-section',
      lessonId: 'l1-joins-fanout',
      sectionId: '0',
      model: 'gemini-3.8-flash-low',
      contentVersion: 2,
    });
    expect(k1).toMatch(/^[a-f0-9]{64}$/);
    expect(k1).not.toBe(k2);
  });

  it('14. cache guarda explain-section y glossary pero nunca cachea chat libre (tutor) ni consultas con código', () => {
    const tmpCache = fs.mkdtempSync(path.join(os.tmpdir(), 'grano-cache-test-'));

    expect(isCacheableRequest({ mode: 'tutor' })).toBe(false);
    expect(isCacheableRequest({ mode: 'review-sql', code: 'SELECT 1' })).toBe(false);
    expect(
      isCacheableRequest({
        mode: 'explain-section',
        selection: 'texto seleccionado personal',
      })
    ).toBe(false);
    expect(isCacheableRequest({ mode: 'explain-section' })).toBe(true);
    expect(isCacheableRequest({ mode: 'glossary' })).toBe(true);

    const tutorKey = setCachedResponse(
      { mode: 'tutor', lessonId: 'l1', sectionId: '0', model: 'fast' },
      'No debe guardarse',
      { cacheDir: tmpCache }
    );
    expect(tutorKey).toBeNull();

    const savedKey = setCachedResponse(
      {
        mode: 'explain-section',
        lessonId: 'l1-joins-fanout',
        sectionId: '0',
        model: 'gemini-3.8-flash-low',
        contentVersion: 1,
      },
      'Explicación cacheada de la sección 0.',
      { cacheDir: tmpCache }
    );
    expect(savedKey).toMatch(/^[a-f0-9]{64}$/);

    const hit = getCachedResponse(
      {
        mode: 'explain-section',
        lessonId: 'l1-joins-fanout',
        sectionId: '0',
        model: 'gemini-3.8-flash-low',
        contentVersion: 1,
      },
      { cacheDir: tmpCache }
    );
    expect(hit?.response).toBe('Explicación cacheada de la sección 0.');
  });

  it('15. getCachedResponse invalida entradas tras expirar el TTL de 30 días', () => {
    const tmpCache = fs.mkdtempSync(path.join(os.tmpdir(), 'grano-cache-ttl-'));
    const params = {
      mode: 'glossary',
      lessonId: 'l1',
      sectionId: 'grain',
      model: 'gemini-3.8-flash-low',
      contentVersion: 1,
    };
    const t0 = 1_700_000_000_000;
    setCachedResponse(params, 'Definición de grano', { cacheDir: tmpCache, now: t0 });

    const beforeExpiry = getCachedResponse(params, {
      cacheDir: tmpCache,
      now: t0 + CACHE_TTL_MS - 1000,
    });
    expect(beforeExpiry?.response).toBe('Definición de grano');

    const afterExpiry = getCachedResponse(params, {
      cacheDir: tmpCache,
      now: t0 + CACHE_TTL_MS + 1000,
    });
    expect(afterExpiry).toBeNull();
  });

  // ── 5. Cola de concurrencia (máx. 2 procesos simultáneos) ──────
  it('16. AiQueue ejecuta máximo 2 procesos simultáneos y emite posición en cola para el resto', async () => {
    const queue = new AiQueue(2);
    let currentActive = 0;
    let maxObservedActive = 0;
    const queuedPositions = [];
    const resolvers = [];

    const makeTask = (id) =>
      queue.enqueue(
        () =>
          new Promise((resolve) => {
            currentActive += 1;
            maxObservedActive = Math.max(maxObservedActive, currentActive);
            resolvers.push(() => {
              currentActive -= 1;
              resolve(`done-${id}`);
            });
          }),
        {
          onQueued: ({ position }) => {
            queuedPositions.push({ id, position });
          },
        }
      );

    const promises = [1, 2, 3, 4, 5].map((id) => makeTask(id));

    expect(maxObservedActive).toBe(2);
    expect(queuedPositions).toEqual([
      { id: 3, position: 1 },
      { id: 4, position: 2 },
      { id: 5, position: 3 },
    ]);

    while (resolvers.length > 0) {
      const r = resolvers.shift();
      r();
      await new Promise((res) => setTimeout(res, 5));
    }

    const results = await Promise.all(promises);
    expect(results).toEqual(['done-1', 'done-2', 'done-3', 'done-4', 'done-5']);
    expect(maxObservedActive).toBe(2);
  });

  it('17. AiQueue retira de la cola una tarea si su AbortSignal se cancela antes de ejecutarse', async () => {
    const queue = new AiQueue(1);
    let releaseFirst;
    const p1 = queue.enqueue(
      () =>
        new Promise((resolve) => {
          releaseFirst = resolve;
        })
    );

    const ac = new AbortController();
    let secondRan = false;
    const p2 = queue.enqueue(
      async () => {
        secondRan = true;
        return 'ok';
      },
      { signal: ac.signal }
    );

    ac.abort();
    await expect(p2).rejects.toThrow(/cancelada/i);
    releaseFirst('first-done');
    await expect(p1).resolves.toBe('first-done');
    expect(secondRan).toBe(false);
  });

  // ── 6. Clasificación de errores honestos C.6 ───────────────────
  it('18. classifyCliError devuelve exactamente los códigos, mensajes y fix del Apéndice C.6', () => {
    expect(classifyCliError({ code: 'ENOENT' })).toEqual({
      code: 'AGY_NOT_FOUND',
      message: 'No encuentro Antigravity (agy) en este equipo.',
      fix: 'Instala Antigravity o define GRANO_AGY_PATH.',
    });

    expect(classifyCliError(new Error('User not logged in / auth required'))).toEqual({
      code: 'AGY_AUTH',
      message: 'Antigravity no tiene una sesión iniciada.',
      fix: 'Abre Antigravity, inicia sesión y pulsa Reintentar.',
    });

    expect(
      classifyCliError(new Error('Tiempo de espera agotado: sin primer byte en 45 s'))
    ).toEqual({
      code: 'AGY_TIMEOUT',
      message: 'La IA tardó demasiado en responder.',
      fix: 'Reintenta o cambia al modelo Rápido.',
    });

    expect(classifyCliError(new Error('Resource exhausted: quota exceeded'))).toEqual({
      code: 'AGY_QUOTA',
      message: 'Se alcanzó el límite de uso de tu suscripción.',
      fix: 'Prueba más tarde o usa otro modelo.',
    });

    expect(classifyCliError(new Error('Unexpected internal error 500'))).toEqual({
      code: 'AGY_FAILED',
      message: 'La IA no pudo responder.',
      fix: 'Reintenta. Si se repite, ejecuta `npm run ai:check`.',
    });
  });

  // ── 7. Seguridad: Origin, Host y X-Grano-Session ───────────────
  it('19. verifyOriginAndHost permite localhost/127.0.0.1 y bloquea orígenes externos como http://evil.test', () => {
    expect(
      verifyOriginAndHost({
        headers: { origin: 'http://127.0.0.1:5174', host: '127.0.0.1:5174' },
      }).ok
    ).toBe(true);

    expect(
      verifyOriginAndHost({
        headers: { origin: 'http://localhost:4173', host: 'localhost:4173' },
      }).ok
    ).toBe(true);

    const badOrigin = verifyOriginAndHost({
      headers: { origin: 'http://evil.test', host: '127.0.0.1:5174' },
    });
    expect(badOrigin.ok).toBe(false);
    expect(badOrigin.status).toBe(403);

    const badHost = verifyOriginAndHost({
      headers: { origin: 'http://127.0.0.1:5174', host: 'evil.test' },
    });
    expect(badHost.ok).toBe(false);
    expect(badHost.status).toBe(403);
  });

  it('20. injectSessionMeta y verifySessionHeader protegen las peticiones POST con X-Grano-Session', () => {
    const html = '<html><head><title>Grano</title></head><body></body></html>';
    const injected = injectSessionMeta(html, 'tok-secreto-123');
    expect(injected).toContain('<meta name="grano-session" content="tok-secreto-123" />');

    expect(
      verifySessionHeader({ headers: {} }, 'tok-secreto-123', { required: true })
    ).toEqual({
      ok: false,
      status: 403,
      code: 'INVALID_SESSION',
      error: 'Falta la cabecera de sesión X-Grano-Session.',
    });

    expect(
      verifySessionHeader(
        { headers: { 'x-grano-session': 'tok-falso' } },
        'tok-secreto-123',
        { required: true }
      ).ok
    ).toBe(false);

    expect(
      verifySessionHeader(
        { headers: { 'x-grano-session': 'tok-secreto-123' } },
        'tok-secreto-123',
        { required: true }
      ).ok
    ).toBe(true);
  });

  // ── 8. agyRunner con spawn simulado y cancelación ──────────────
  it('21. runAgyStream envía el prompt por stdin con shell:false y emite onMeta, onDelta y onDone', async () => {
    const fakeSpawn = createFakeSpawn(({ child }) => {
      child.stdout.emit('data', Buffer.from('El grano ', 'utf8'));
      setTimeout(() => {
        child.stdout.emit('data', Buffer.from('define una fila.', 'utf8'));
        child.emit('close', 0);
      }, 15);
    });

    const deltas = [];
    let metaEvent = null;
    let doneEvent = null;

    const result = await runAgyStream({
      prompt: 'Pregunta por stdin',
      model: 'gemini-3.8-flash-low',
      agyBinPath: 'C:\\fake\\agy.exe',
      spawnImpl: fakeSpawn,
      onMeta: (m) => {
        metaEvent = m;
      },
      onDelta: (t) => {
        deltas.push(t);
      },
      onDone: (d) => {
        doneEvent = d;
      },
    });

    expect(fakeSpawn.calls.length).toBe(1);
    expect(fakeSpawn.calls[0].options.shell).toBe(false);
    expect(fakeSpawn.calls[0].args).toEqual([
      '--model',
      'gemini-3.8-flash-low',
      '--sandbox',
      '--disable-slash-commands',
    ]);
    expect(fakeSpawn.calls[0].child.stdinData).toBe('Pregunta por stdin');
    expect(metaEvent.model).toBe('gemini-3.8-flash-low');
    expect(deltas).toEqual(['El grano ', 'define una fila.']);
    expect(doneEvent.text).toBe('El grano define una fila.');
    expect(result.chars).toBe('El grano define una fila.'.length);
  });

  it('22. runAgyStream mata el proceso hijo (child.kill) inmediatamente cuando se aborta el AbortSignal', async () => {
    let spawnedChild = null;
    const fakeSpawn = createFakeSpawn(({ child }) => {
      spawnedChild = child;
      child.stdout.emit('data', Buffer.from('Inicio parcial...', 'utf8'));
      // No cierra por sí solo: simula generación larga
    });

    const ac = new AbortController();
    const promise = runAgyStream({
      prompt: 'Consulta larga',
      model: 'gemini-3.8-flash-low',
      agyBinPath: 'C:\\fake\\agy.exe',
      spawnImpl: fakeSpawn,
      signal: ac.signal,
    });

    setTimeout(() => {
      ac.abort();
    }, 25);

    await expect(promise).rejects.toThrow(/cancelada/i);
    expect(spawnedChild).not.toBeNull();
    expect(spawnedChild.killed).toBe(true);
  });

  it('23. runAgyStream aborta con AGY_TIMEOUT si no llega el primer byte a tiempo', async () => {
    let spawnedChild = null;
    const fakeSpawn = createFakeSpawn(({ child }) => {
      spawnedChild = child;
      // Silencio total en stdout
    });

    await expect(
      runAgyStream({
        prompt: 'Consulta bloqueada',
        model: 'gemini-3.8-flash-low',
        agyBinPath: 'C:\\fake\\agy.exe',
        spawnImpl: fakeSpawn,
        firstByteTimeoutMs: 40,
        totalTimeoutMs: 500,
      })
    ).rejects.toMatchObject({ code: 'AGY_TIMEOUT' });

    expect(spawnedChild.killed).toBe(true);
  });

  it('24. fetchAgyModels parsea la salida de agy models y la cachea durante 10 minutos', async () => {
    const fakeSpawn = createFakeSpawn(({ child }) => {
      child.stdout.emit(
        'data',
        Buffer.from(
          'Fetching available models...\ngemini-3.8-flash-low\tGemini 3.8 Flash (Low)\ngemini-4-argon-medium\tGemini 4 Argon (Medium)\n',
          'utf8'
        )
      );
      child.emit('close', 0);
    });

    const first = await fetchAgyModels({
      agyBinPath: 'C:\\fake\\agy.exe',
      spawnImpl: fakeSpawn,
      force: true,
    });
    expect(first.cached).toBe(false);
    expect(first.models).toEqual([
      { id: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low)' },
      { id: 'gemini-4-argon-medium', label: 'Gemini 4 Argon (Medium)' },
    ]);

    const second = await fetchAgyModels({
      agyBinPath: 'C:\\fake\\agy.exe',
      spawnImpl: fakeSpawn,
    });
    expect(second.cached).toBe(true);
    expect(fakeSpawn.calls.length).toBe(1);
  });

  // ── 9. Endpoints HTTP (/api/ai/json con reintento, /api/ai/status y /api/ai/chat SSE) ──
  it('25. POST /api/ai/json valida con Zod y reintenta 1 vez si el primer JSON del modelo es inválido', async () => {
    let attemptCount = 0;
    const fakeSpawn = createFakeSpawn(({ args, child }) => {
      if (args[0] === 'models') {
        child.stdout.emit(
          'data',
          Buffer.from('gemini-3.8-flash-low\tGemini 3.8 Flash (Low)\n', 'utf8')
        );
        child.emit('close', 0);
        return;
      }
      attemptCount += 1;
      if (attemptCount === 1) {
        // Primer intento devuelve JSON incompleto que no pasa el esquema Zod de feynman
        child.stdout.emit('data', Buffer.from('{"score": 99}', 'utf8'));
        child.emit('close', 0);
      } else {
        // Segundo intento (reintento automático) devuelve JSON válido
        child.stdout.emit(
          'data',
          Buffer.from(
            JSON.stringify({
              score: 4,
              aciertos: ['Identificó correctamente el grano de orders'],
              huecos: [],
              siguientePaso: 'Practicar el caso N:1:M con refunds.',
            }),
            'utf8'
          )
        );
        child.emit('close', 0);
      }
    });

    const middleware = createAiRoutes({
      spawnImpl: fakeSpawn,
      sessionToken: 'test-token-json',
    });

    const server = http.createServer((req, res) => middleware(req, res));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/ai/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${port}`,
          'X-Grano-Session': 'test-token-json',
        },
        body: JSON.stringify({
          mode: 'feynman',
          lessonId: 'l1-joins-fanout',
          text: 'Una fila de orders representa un pedido único identificado por order_id.',
        }),
      });

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.attempts).toBe(2);
      expect(body.data.score).toBe(4);
      expect(attemptCount).toBe(2);
    } finally {
      server.close();
    }
  });

  it('26. GET /api/ai/status con GRANO_AGY_PATH inexistente devuelve AGY_NOT_FOUND y POST /api/ai/chat con GRANO_AI_MOCK=1 emite SSE con [MOCK]', async () => {
    process.env.GRANO_AGY_PATH = 'C:\\ruta-que-no-existe\\agy.exe';
    expect(detectAgy().hasAgy).toBe(false);

    const middleware = createAiRoutes({ sessionToken: 'test-token-sse' });
    const server = http.createServer((req, res) => middleware(req, res));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const statusRes = await fetch(`http://127.0.0.1:${port}/api/ai/status`);
      const statusJson = await statusRes.json();
      expect(statusJson.available).toBe(false);
      expect(statusJson.code).toBe('AGY_NOT_FOUND');

      // Ahora activamos GRANO_AI_MOCK=1 y quitamos GRANO_AGY_PATH inválido
      delete process.env.GRANO_AGY_PATH;
      process.env.GRANO_AI_MOCK = '1';

      const chatRes = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${port}`,
          'X-Grano-Session': 'test-token-sse',
        },
        body: JSON.stringify({
          mode: 'tutor',
          lessonId: 'l1-joins-fanout',
          messages: [{ role: 'user', content: '¿Qué es el grano?' }],
        }),
      });

      expect(chatRes.status).toBe(200);
      expect(chatRes.headers.get('content-type')).toContain('text/event-stream');
      const sseText = await chatRes.text();
      expect(sseText).toContain('event: meta');
      expect(sseText).toContain('event: delta');
      expect(sseText).toContain('[MOCK]');
      expect(sseText).toContain('event: done');
    } finally {
      server.close();
    }
  });
});
