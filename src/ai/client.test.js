import { describe, it, expect, beforeEach } from 'vitest';
import {
  setClientSessionTokenForTests,
  getSessionToken,
  buildRequestHeaders,
  parseSseEventBlock,
  consumeSseStream,
  streamChat,
  requestAiJson,
  getStatus,
  getModels,
  normalizeAiError,
  FeynmanRubricSchema,
  QuizMoreSchema,
  InterviewGradeSchema,
} from './client.js';

function createReadableStreamFromChunks(chunks) {
  const encoder = new TextEncoder();
  let idx = 0;
  return new ReadableStream({
    pull(controller) {
      if (idx < chunks.length) {
        controller.enqueue(encoder.encode(chunks[idx]));
        idx += 1;
      } else {
        controller.close();
      }
    },
  });
}

describe('src/ai/client.js y esquemas Zod', () => {
  beforeEach(() => {
    setClientSessionTokenForTests('test-session-token-123');
  });

  it('lee el token de sesión y lo incluye siempre en X-Grano-Session', () => {
    expect(getSessionToken()).toBe('test-session-token-123');
    const headers = buildRequestHeaders({ 'Content-Type': 'application/json' });
    expect(headers['X-Grano-Session']).toBe('test-session-token-123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('parsea bloques SSE individuales con JSON', () => {
    const block = 'event: delta\ndata: {"text":"SELECT ","firstTokenMs":410}';
    const parsed = parseSseEventBlock(block);
    expect(parsed).toEqual({
      event: 'delta',
      data: { text: 'SELECT ', firstTokenMs: 410 },
    });
  });

  it('consume un flujo SSE fragmentado con eventos queued, meta, delta y done', async () => {
    const rawChunks = [
      'event: queued\ndata: {"position":2}\n\nevent: meta\n',
      'data: {"model":"gemini-3.8-flash-low","startedAt":1000}\n\n',
      'event: delta\ndata: {"text":"El grano ","firstTokenMs":520}\n\n',
      'event: delta\ndata: {"text":"es una fila por pedido."}\n\n',
      'event: done\ndata: {"durationMs":1450,"firstTokenMs":520,"chars":31,"model":"gemini-3.8-flash-low"}\n\n',
    ];
    const stream = createReadableStreamFromChunks(rawChunks);

    const events = { queued: [], meta: [], deltas: [], done: null };
    const result = await consumeSseStream(stream, {
      onQueued: (q) => events.queued.push(q),
      onMeta: (m) => events.meta.push(m),
      onDelta: (text) => events.deltas.push(text),
      onDone: (d) => {
        events.done = d;
      },
    });

    expect(events.queued).toEqual([{ position: 2 }]);
    expect(events. deltas.join('')).toBe('El grano es una fila por pedido.');
    expect(result.ok).toBe(true);
    expect(result.text).toBe('El grano es una fila por pedido.');
    expect(result.firstTokenMs).toBe(520);
    expect(result.durationMs).toBe(1450);
  });

  it('streamChat envía X-Grano-Session y procesa eventos SSE correctamente', async () => {
    let capturedHeaders = null;
    let capturedBody = null;

    const mockFetch = async (_url, options) => {
      capturedHeaders = options.headers;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: {
          get: (name) =>
            name.toLowerCase() === 'content-type'
              ? 'text/event-stream; charset=utf-8'
              : null,
        },
        body: createReadableStreamFromChunks([
          'event: meta\ndata: {"model":"gemini-3.8-flash-low"}\n\n',
          'event: delta\ndata: {"text":"Respuesta real","firstTokenMs":310}\n\n',
          'event: done\ndata: {"durationMs":800,"firstTokenMs":310,"chars":14,"model":"gemini-3.8-flash-low"}\n\n',
        ]),
      };
    };

    const res = await streamChat(
      {
        mode: 'tutor',
        lessonId: 'c1-sql-joins-02-grano-fanout',
        sectionId: 'que-es-el-grano',
        messages: [{ role: 'user', content: '¿Qué es el grano?' }],
        model: 'gemini-3.8-flash-low',
      },
      { fetchImpl: mockFetch }
    );

    expect(capturedHeaders['X-Grano-Session']).toBe('test-session-token-123');
    expect(capturedBody.lessonId).toBe('c1-sql-joins-02-grano-fanout');
    expect(res.text).toBe('Respuesta real');
    expect(res.firstTokenMs).toBe(310);
  });

  it('streamChat propaga cancelación con AbortController', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      streamChat(
        {
          mode: 'tutor',
          messages: [{ role: 'user', content: 'Pregunta' }],
        },
        { signal: controller.signal }
      )
    ).rejects.toMatchObject({
      code: 'ABORTED',
      aborted: true,
    });
  });

  it('requestAiJson valida feynman, quiz-more e interview con Zod en el cliente', async () => {
    const validFeynman = {
      score: 4,
      aciertos: ['Define qué representa una fila en orders y en order_items.'],
      huecos: [],
      siguientePaso: 'Comprueba la consulta pre-agregada en el laboratorio.',
    };

    const mockFetchFeynman = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        mode: 'feynman',
        model: 'gemini-3.8-flash-low',
        data: validFeynman,
        attempts: 1,
        durationMs: 1200,
      }),
    });

    const feynmanRes = await requestAiJson({
      mode: 'feynman',
      lessonId: 'c1-sql-joins-02-grano-fanout',
      text: 'Mi explicación sobre el grano de orders y order_items.',
      fetchImpl: mockFetchFeynman,
    });
    expect(feynmanRes.ok).toBe(true);
    expect(feynmanRes.data.score).toBe(4);
    expect(FeynmanRubricSchema.safeParse(feynmanRes.data).success).toBe(true);

    const validQuiz = {
      questions: [
        {
          id: 'q1',
          prompt: '¿Qué representa una fila en orders?',
          options: [
            { id: 'a', text: 'Un pedido', correct: true, feedback: 'Exacto.' },
            { id: 'b', text: 'Un producto', correct: false, feedback: 'Eso es order_items.' },
            { id: 'c', text: 'Un reembolso', correct: false, feedback: 'Eso es refunds.' },
          ],
          explanation: 'El grano de orders es un pedido por fila.',
        },
      ],
    };

    const quizRes = await requestAiJson({
      mode: 'quiz-more',
      lessonId: 'c1-sql-joins-02-grano-fanout',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: validQuiz }),
      }),
    });
    expect(quizRes.data.questions).toHaveLength(1);
    expect(QuizMoreSchema.safeParse(quizRes.data).success).toBe(true);

    const validInterview = {
      score: 3,
      fortalezas: ['Identificó el riesgo de fan-out 1:N.'],
      mejoras: ['Faltó detallar la pre-agregación en CTE.'],
      respuestaModelo: 'Se pre-agrega order_items por order_id antes de unir con orders.',
      siguientePregunta: '¿Qué ocurre si un pedido no tiene ítems?',
    };

    const interviewRes = await requestAiJson({
      mode: 'interview',
      answer: 'Primero reviso el grano de ambas tablas.',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: validInterview }),
      }),
    });
    expect(interviewRes.data.score).toBe(3);
    expect(InterviewGradeSchema.safeParse(interviewRes.data).success).toBe(true);
  });

  it('requestAiJson rechaza respuestas que no cumplen el esquema Zod', async () => {
    const invalidFeynman = {
      score: 99, // inválido: debe ser 0..4
      aciertos: [],
      huecos: [],
      siguientePaso: '',
    };

    await expect(
      requestAiJson({
        mode: 'feynman',
        text: 'Texto de prueba',
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, data: invalidFeynman }),
        }),
      })
    ).rejects.toMatchObject({
      code: 'JSON_SCHEMA_INVALID',
    });
  });

  it('getStatus y getModels procesan estado disponible y AGY_NOT_FOUND', async () => {
    const statusUnavailable = await getStatus({
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ok: false,
          available: false,
          code: 'AGY_NOT_FOUND',
          message: 'No encuentro Antigravity (agy) en este equipo.',
          fix: 'Instala Antigravity o define GRANO_AGY_PATH.',
        }),
      }),
    });

    expect(statusUnavailable.available).toBe(false);
    expect(statusUnavailable.code).toBe('AGY_NOT_FOUND');
    expect(statusUnavailable.steps.length).toBeGreaterThan(0);

    const modelsRes = await getModels({
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          models: [{ id: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low)' }],
        }),
      }),
    });
    expect(modelsRes.ok).toBe(true);
    expect(modelsRes.models[0].id).toBe('gemini-3.8-flash-low');
  });

  it('normalizeAiError devuelve pasos de solución honestos según el código C.6', () => {
    const err = normalizeAiError({ code: 'AGY_TIMEOUT' });
    expect(err.code).toBe('AGY_TIMEOUT');
    expect(err.steps.length).toBeGreaterThan(0);
  });
});
