import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Code2,
  FileWarning,
  RotateCcw,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from './ui/index.js';
import {
  streamChat,
  getStatus,
  getModels,
  normalizeAiError,
  syncTopbarAiButtonStatus,
} from '../ai/client.js';
import {
  appendTutorMessage,
  clearTutorThread,
  closeTutor,
  setPref,
  usePrefs,
  useProfile,
  useProgress,
  useTutorState,
} from '../state/store.js';
import { getLessonById } from '../data/lessons/index.js';
import { formatInlineText, stripSectionNumber } from '../utils/formatText.jsx';
import {
  renderTutorMarkdown,
  FeynmanRubricCard,
  ExtraQuizCard,
  InterviewSimulator,
} from './tutor/index.js';

const PANEL_TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'feynman', label: 'Explícalo' },
  { id: 'quiz-more', label: '+3 preguntas' },
  { id: 'interview', label: 'Entrevista' },
];

const CHAT_SUBMODES = {
  tutor: {
    id: 'tutor',
    label: 'Consulta sobre la sección',
    placeholder: 'Escribe tu pregunta sobre la lección o una consulta SQL... (Enter envía)',
  },
  'explain-error': {
    id: 'explain-error',
    label: 'Explicar un fallo o error',
    placeholder: 'Describe el error o pega el mensaje devuelto por SQL...',
  },
  'review-sql': {
    id: 'review-sql',
    label: 'Revisar consulta SQL',
    placeholder: '¿Qué quieres comprobar en tu consulta SQL?',
  },
};

/**
 * Convierte el array de mensajes guardado en `tutor.threads[lessonId]` en una lista
 * cronológica limpia de turnos `{ id, role, content, ... }`, compatible tanto con el formato
 * nuevo (mensajes separados `user` y `assistant`) como con entradas heredadas.
 */
function normalizeThreadMessages(rawThread) {
  if (!Array.isArray(rawThread) || rawThread.length === 0) return [];
  const items = [];

  for (let i = 0; i < rawThread.length; i += 1) {
    const msg = rawThread[i];
    if (!msg || typeof msg !== 'object') continue;

    if (msg.role === 'user') {
      items.push({
        id: msg.id || `u-${i}`,
        role: 'user',
        content: String(msg.content || msg.question || ''),
        selection: msg.selection || null,
        code: msg.code || null,
        result: msg.result || null,
        chatMode: msg.chatMode || 'tutor',
        createdAt: msg.createdAt,
      });
      continue;
    }

    if (msg.role === 'assistant') {
      const prev = items[items.length - 1];
      if (
        msg.question &&
        (!prev || prev.role !== 'user' || prev.content !== msg.question)
      ) {
        items.push({
          id: `u-legacy-${i}`,
          role: 'user',
          content: String(msg.question),
          createdAt: msg.createdAt,
        });
      }
      items.push({
        id: msg.id || `a-${i}`,
        role: 'assistant',
        content: String(msg.content || msg.answer || ''),
        model: msg.model || msg.source || 'gemini-3.8-flash-low',
        firstTokenMs:
          typeof msg.firstTokenMs === 'number' ? msg.firstTokenMs : null,
        elapsedMs: typeof msg.elapsedMs === 'number' ? msg.elapsedMs : null,
        cached: Boolean(msg.cached),
        isError: Boolean(msg.isError),
        createdAt: msg.createdAt,
      });
    }
  }

  return items;
}

export function TutorPanel({
  currentLesson,
  activeStepLabel,
  engineMode = 'fast',
  onChangeEngineMode = () => {},
  aiInput: externalInput,
  onChangeAiInput,
  onClose,
}) {
  const tutorState = useTutorState();
  const prefs = usePrefs();
  const profile = useProfile();
  const progress = useProgress();

  const [activeTab, setActiveTab] = useState('chat');
  const [localEngineMode, setLocalEngineMode] = useState(engineMode || 'fast');
  const [chatSubMode, setChatSubMode] = useState('tutor');
  const [localInput, setLocalInput] = useState('');
  const [attachedSelection, setAttachedSelection] = useState('');
  const [attachedCode, setAttachedCode] = useState('');
  const [attachedResult, setAttachedResult] = useState('');
  const [showCodeAttachmentBox, setShowCodeAttachmentBox] = useState(false);

  // Estado de disponibilidad de `agy` (/api/ai/status)
  const [aiStatus, setAiStatus] = useState({
    checked: false,
    available: true,
    version: null,
    defaultModels: {
      fast: prefs?.aiModelFast || 'gemini-3.8-flash-low',
      deep: prefs?.aiModelDeep || 'gemini-4-argon-medium',
    },
    code: null,
    message: null,
    fix: null,
    steps: [],
  });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);

  // Estado de petición en curso (pensando / en cola / streaming / error)
  const [streamPhase, setStreamPhase] = useState('idle'); // 'idle' | 'waiting' | 'queued' | 'streaming'
  const [queuePosition, setQueuePosition] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [streamingText, setStreamingText] = useState('');
  const [streamMeta, setStreamMeta] = useState({
    model: null,
    firstTokenMs: null,
  });
  const [errorState, setErrorState] = useState(null);
  const [stoppedNotice, setStoppedNotice] = useState(null);
  const [lastRequestPayload, setLastRequestPayload] = useState(null);

  // Anuncio accesible aria-live="polite" (solo se actualiza al terminar, no en cada delta)
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const streamStartMsRef = useRef(null);

  const inputValue =
    typeof externalInput === 'string' && typeof onChangeAiInput === 'function'
      ? externalInput
      : localInput;

  const setInputValue = useCallback(
    (val) => {
      setLocalInput(val);
      if (typeof onChangeAiInput === 'function') {
        onChangeAiInput(val);
      }
    },
    [onChangeAiInput]
  );

  // Resolver lección y sección activas
  const resolvedLesson = useMemo(() => {
    const candidateId =
      tutorState?.lessonId || currentLesson?.v2Id || currentLesson?.id;
    return getLessonById(candidateId) || currentLesson || null;
  }, [tutorState?.lessonId, currentLesson]);

  const lessonKey = currentLesson?.id || resolvedLesson?.id || 'general';
  const v2LessonId = resolvedLesson?.v2Id || resolvedLesson?.id || lessonKey;
  const lessonTitle = resolvedLesson?.title || 'Fundamentos de datos';
  const lessonLevel =
    typeof resolvedLesson?.level === 'number'
      ? resolvedLesson.level
      : profile?.startLevel ?? 1;
  const activeTrack =
    profile?.track ||
    (Array.isArray(resolvedLesson?.tracks) ? resolvedLesson.tracks[0] : 'core') ||
    'core';

  const activeSectionInfo = useMemo(() => {
    const sections = Array.isArray(resolvedLesson?.sections)
      ? resolvedLesson.sections
      : [];
    const lessonProg =
      progress?.lessons?.[lessonKey] || progress?.lessons?.[v2LessonId];
    const requestedSectionId =
      tutorState?.sectionId ?? lessonProg?.sectionId ?? null;
    const stepIdx = Number(lessonProg?.stepIndex ?? 0);

    if (requestedSectionId !== null && requestedSectionId !== undefined && sections.length > 0) {
      const foundIdx = sections.findIndex(
        (s, idx) =>
          s.id === String(requestedSectionId) || String(idx) === String(requestedSectionId)
      );
      if (foundIdx >= 0) {
        const sec = sections[foundIdx];
        return {
          id: sec.id || String(foundIdx),
          index: foundIdx + 1,
          heading: stripSectionNumber(sec.heading || `Sección ${foundIdx + 1}`),
          label: `Sección ${foundIdx + 1}`,
        };
      }
    }

    if (sections.length > 0) {
      const clampedIdx = Math.min(sections.length - 1, Math.max(0, stepIdx));
      const sec = sections[clampedIdx];
      return {
        id: sec.id || String(clampedIdx),
        index: clampedIdx + 1,
        heading: stripSectionNumber(sec.heading || `Sección ${clampedIdx + 1}`),
        label: `Sección ${clampedIdx + 1}`,
      };
    }

    const cleanedStep = activeStepLabel
      ? stripSectionNumber(activeStepLabel)
      : 'Sección 1';
    return {
      id: '0',
      index: 1,
      heading: cleanedStep,
      label: cleanedStep,
    };
  }, [
    resolvedLesson,
    progress?.lessons,
    lessonKey,
    v2LessonId,
    tutorState?.sectionId,
    activeStepLabel,
  ]);

  useEffect(() => {
    if (engineMode === 'fast' || engineMode === 'deep') {
      setLocalEngineMode(engineMode);
    }
  }, [engineMode]);

  const effectiveEngineMode = localEngineMode;

  const handleSelectEngineMode = useCallback(
    (nextMode) => {
      setLocalEngineMode(nextMode);
      if (typeof onChangeEngineMode === 'function') {
        onChangeEngineMode(nextMode);
      }
    },
    [onChangeEngineMode]
  );

  // Modelo rápido vs profundo desde preferencias
  const fastModelId =
    prefs?.aiModelFast || aiStatus.defaultModels?.fast || 'gemini-3.8-flash-low';
  const deepModelId =
    prefs?.aiModelDeep || aiStatus.defaultModels?.deep || 'gemini-4-argon-medium';
  const activeModelId = effectiveEngineMode === 'deep' ? deepModelId : fastModelId;

  // Historial de mensajes de la lección actual desde el store
  const threadMessages = useMemo(() => {
    const raw =
      tutorState?.threads?.[lessonKey] ||
      tutorState?.threads?.[v2LessonId] ||
      [];
    return normalizeThreadMessages(raw);
  }, [tutorState?.threads, lessonKey, v2LessonId]);

  // Sugerencias contextuales (máximo 3, cambian según sección/modo)
  const contextualSuggestions = useMemo(() => {
    const secName = activeSectionInfo.heading || activeSectionInfo.label;
    return [
      {
        label: 'Explícame esta sección con otro ejemplo',
        prompt: `Explícame la sección "${secName}" de "${lessonTitle}" con otro ejemplo práctico sobre Mercado Brisa.`,
        mode: 'tutor',
      },
      {
        label: '¿Qué error de trabajo evita esto?',
        prompt: `¿Qué error real de trabajo evita el concepto de "${secName}" en "${lessonTitle}"?`,
        mode: 'tutor',
      },
      {
        label: 'Hazme una pregunta para comprobar si lo entendí',
        prompt: `Hazme una pregunta corta de caso práctico sobre "${secName}" para comprobar si lo entendí.`,
        mode: 'tutor',
      },
    ];
  }, [activeSectionInfo.heading, activeSectionInfo.label, lessonTitle]);

  const checkAiAvailability = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const status = await getStatus();
      setAiStatus(status);
      syncTopbarAiButtonStatus(status, prefs?.aiEnabled !== false);
      if (status.available) {
        const modelsData = await getModels();
        if (modelsData.ok && Array.isArray(modelsData.models)) {
          setAvailableModels(modelsData.models);
        }
      }
    } finally {
      setCheckingStatus(false);
    }
  }, [prefs?.aiEnabled]);

  useEffect(() => {
    checkAiAvailability();
  }, [checkAiAvailability]);

  // Sincronizar contexto efímero cuando se invoca openTutor({ mode, selection, code, result, prefill })
  useEffect(() => {
    const ctx = tutorState?.context;
    if (!ctx) return;

    if (
      ctx.mode === 'feynman' ||
      ctx.mode === 'quiz-more' ||
      ctx.mode === 'interview'
    ) {
      setActiveTab(ctx.mode);
    } else if (ctx.mode === 'explain-error' || ctx.mode === 'review-sql') {
      setActiveTab('chat');
      setChatSubMode(ctx.mode);
    } else if (ctx.mode === 'tutor') {
      setActiveTab('chat');
      setChatSubMode('tutor');
    }

    if (typeof ctx.selection === 'string' && ctx.selection.trim()) {
      setAttachedSelection(ctx.selection.trim());
    }
    if (typeof ctx.code === 'string' && ctx.code.trim()) {
      setAttachedCode(ctx.code.trim());
      setShowCodeAttachmentBox(true);
    }
    if (ctx.result !== undefined && ctx.result !== null && ctx.result !== '') {
      setAttachedResult(
        typeof ctx.result === 'string'
          ? ctx.result
          : JSON.stringify(ctx.result).slice(0, 1200)
      );
    }
    if (typeof ctx.prefill === 'string' && ctx.prefill.trim()) {
      setInputValue(ctx.prefill.trim());
    } else if (ctx.mode === 'explain-error') {
      setInputValue(
        'Explica por qué ocurrió este fallo y qué debo cambiar para corregirlo.'
      );
    } else if (ctx.mode === 'review-sql') {
      setInputValue(
        'Revisa mi consulta SQL evaluando el grano, la legibilidad y una mejora concreta.'
      );
    }
  }, [tutorState?.context?.openedAt, tutorState?.context, setInputValue]);

  // Limpiar estado efímero de streaming/error al cambiar de lección
  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStreamPhase('idle');
    setStreamingText('');
    setQueuePosition(null);
    setErrorState(null);
    setStoppedNotice(null);
  }, [lessonKey]);

  // Foco automático al textarea al abrir en pestaña chat
  useEffect(() => {
    if (activeTab === 'chat' && aiStatus.available && prefs?.aiEnabled !== false) {
      const t = setTimeout(() => {
        textareaRef.current?.focus();
      }, 40);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [activeTab, aiStatus.available, prefs?.aiEnabled, lessonKey]);

  // Cerrar con tecla Escape
  const handleClosePanel = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      closeTutor();
    }
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClosePanel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClosePanel]);

  // Contador real en segundos mientras está esperando primer token, en cola o en streaming
  useEffect(() => {
    if (streamPhase === 'idle') {
      setElapsedSec(0);
      return undefined;
    }
    const startMs = streamStartMsRef.current || Date.now();
    setElapsedSec(Math.floor((Date.now() - startMs) / 1000));
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startMs) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [streamPhase]);

  // Limpiar proceso en curso al desmontar
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Auto-scroll suave al fondo cuando llegan mensajes o cambia el estado
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      try {
        messagesEndRef.current.scrollIntoView({ block: 'nearest' });
      } catch {}
    }
  }, [threadMessages.length, streamingText, streamPhase, errorState]);

  const isBusy = streamPhase !== 'idle';
  const isAiUnavailable = !aiStatus.available || prefs?.aiEnabled === false;

  const handleStopStream = useCallback(() => {
    const sec = elapsedSec;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingText.trim().length > 0) {
      appendTutorMessage(lessonKey, {
        id: `a-aborted-${Date.now()}`,
        role: 'assistant',
        content: `${streamingText.trim()}\n\n*(Respuesta detenida a los ${sec} s)*`,
        answer: `${streamingText.trim()}\n\n*(Respuesta detenida a los ${sec} s)*`,
        model: streamMeta.model || activeModelId,
        firstTokenMs: streamMeta.firstTokenMs,
        elapsedMs: sec * 1000,
      });
    }
    setStreamingText('');
    setStreamPhase('idle');
    setQueuePosition(null);
    setStoppedNotice(`Consulta detenida a los ${sec} s.`);
    setPoliteAnnouncement(`Consulta detenida a los ${sec} segundos.`);
  }, [
    elapsedSec,
    streamingText,
    lessonKey,
    streamMeta.model,
    streamMeta.firstTokenMs,
    activeModelId,
  ]);

  const executeChatRequest = useCallback(
    async ({
      questionText,
      modeToUse = chatSubMode,
      selectionToUse = attachedSelection,
      codeToUse = attachedCode,
      resultToUse = attachedResult,
      appendUserTurn = true,
    }) => {
      const cleanQuestion = String(questionText || '').trim();
      if (!cleanQuestion || isBusy || isAiUnavailable) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      streamStartMsRef.current = Date.now();

      setErrorState(null);
      setStoppedNotice(null);
      setStreamingText('');
      setQueuePosition(null);
      setStreamMeta({ model: activeModelId, firstTokenMs: null });
      setStreamPhase('waiting');
      setPoliteAnnouncement('Pensando respuesta del tutor.');

      if (appendUserTurn) {
        appendTutorMessage(lessonKey, {
          id: `u-${Date.now()}`,
          role: 'user',
          content: cleanQuestion,
          question: cleanQuestion,
          selection: selectionToUse || undefined,
          code: codeToUse || undefined,
          result: resultToUse || undefined,
          chatMode: modeToUse,
          createdAt: new Date().toISOString(),
        });
      }

      // Construir historial reciente (máx. 12 mensajes para el servidor)
      const recentHistory = threadMessages
        .filter((m) => !m.isError && m.content.trim().length > 0)
        .slice(-11)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      const messagesPayload = [
        ...recentHistory,
        { role: 'user', content: cleanQuestion },
      ];

      const reqPayload = {
        mode: modeToUse || 'tutor',
        lessonId: v2LessonId,
        sectionId: activeSectionInfo.id,
        messages: messagesPayload,
        question: cleanQuestion,
        selection: selectionToUse || undefined,
        code: codeToUse || undefined,
        result: resultToUse || undefined,
        model: activeModelId,
        track: activeTrack,
        level: lessonLevel,
      };

      setLastRequestPayload({
        questionText: cleanQuestion,
        modeToUse,
        selectionToUse,
        codeToUse,
        resultToUse,
      });

      // Limpiar adjuntos efímeros tras enviar
      setAttachedSelection('');
      if (modeToUse === 'tutor') {
        setShowCodeAttachmentBox(false);
      }

      try {
        await streamChat(reqPayload, {
          signal: controller.signal,
          onQueued: ({ position }) => {
            setQueuePosition(position);
            setStreamPhase('queued');
          },
          onMeta: (meta) => {
            if (meta?.model) {
              setStreamMeta((prev) => ({ ...prev, model: meta.model }));
            }
          },
          onDelta: (_chunk, info) => {
            setStreamPhase('streaming');
            setStreamingText(info.accumulatedText);
            if (typeof info.firstTokenMs === 'number') {
              setStreamMeta((prev) => ({
                ...prev,
                firstTokenMs: prev.firstTokenMs ?? info.firstTokenMs,
              }));
            }
          },
          onDone: (doneInfo) => {
            const finalContent = String(doneInfo.text || '').trim();
            const usedModel = doneInfo.model || activeModelId;
            const totalMs =
              doneInfo.durationMs || Date.now() - (streamStartMsRef.current || Date.now());
            const firstMs =
              doneInfo.firstTokenMs ?? streamMeta.firstTokenMs ?? totalMs;

            if (finalContent) {
              appendTutorMessage(lessonKey, {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: finalContent,
                answer: finalContent,
                question: cleanQuestion,
                model: usedModel,
                source: usedModel,
                firstTokenMs: firstMs,
                elapsedMs: totalMs,
                cached: Boolean(doneInfo.cached),
                createdAt: new Date().toISOString(),
              });
              setPoliteAnnouncement(
                `Respuesta del tutor completada en ${(totalMs / 1000).toFixed(1)} segundos.`
              );
            }
            setStreamingText('');
            setStreamPhase('idle');
            setQueuePosition(null);
          },
        });
      } catch (err) {
        const normalized = normalizeAiError(err);
        if (normalized.aborted) {
          setStreamPhase('idle');
          setQueuePosition(null);
          return;
        }
        setStreamingText('');
        setStreamPhase('idle');
        setQueuePosition(null);
        setErrorState(normalized);
        setPoliteAnnouncement(`Error del tutor: ${normalized.message}`);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      chatSubMode,
      attachedSelection,
      attachedCode,
      attachedResult,
      isBusy,
      isAiUnavailable,
      activeModelId,
      lessonKey,
      threadMessages,
      v2LessonId,
      activeSectionInfo.id,
      activeTrack,
      lessonLevel,
      streamMeta.firstTokenMs,
    ]
  );

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isBusy || isAiUnavailable) return;
    setInputValue('');
    executeChatRequest({
      questionText: trimmed,
      modeToUse: chatSubMode,
      appendUserTurn: true,
    });
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  const handleRetryLast = () => {
    if (!lastRequestPayload || isBusy) return;
    executeChatRequest({
      ...lastRequestPayload,
      appendUserTurn: false,
    });
  };

  const handleNewConversation = () => {
    abortControllerRef.current?.abort();
    setStreamPhase('idle');
    setStreamingText('');
    setErrorState(null);
    setStoppedNotice(null);
    setAttachedSelection('');
    setAttachedCode('');
    setAttachedResult('');
    setChatSubMode('tutor');
    clearTutorThread(lessonKey);
    if (v2LessonId !== lessonKey) {
      clearTutorThread(v2LessonId);
    }
    setPoliteAnnouncement('Conversación reiniciada.');
    textareaRef.current?.focus();
  };

  const handleLoadLessonSqlForReview = () => {
    const sampleSql =
      resolvedLesson?.practice?.starterCode ||
      resolvedLesson?.workedExample?.steps?.[0]?.code ||
      resolvedLesson?.playground?.goodQuery ||
      'SELECT order_id, customer_id, status, total_usd FROM orders LIMIT 10;';
    setAttachedCode(sampleSql);
    setChatSubMode('review-sql');
    setShowCodeAttachmentBox(true);
    if (!inputValue.trim()) {
      setInputValue(
        'Revisa esta consulta SQL: comprueba si respeta el grano, si es legible y qué mejorarías.'
      );
    }
    textareaRef.current?.focus();
  };

  const handlePrepareExplainError = () => {
    setChatSubMode('explain-error');
    setShowCodeAttachmentBox(true);
    if (!inputValue.trim()) {
      setInputValue(
        'Explica por qué falla esta consulta o comprobación y qué debo revisar.'
      );
    }
    textareaRef.current?.focus();
  };

  const activeSubModeInfo = CHAT_SUBMODES[chatSubMode] || CHAT_SUBMODES.tutor;

  return (
    <div className="tutor-panel" data-testid="tutor-panel">
      <div className="tutor-panel__handle" aria-hidden="true" />

      {/* Región aria-live="polite" que anuncia al terminar la respuesta, no cada delta */}
      <div
        className="tutor-sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {politeAnnouncement}
      </div>

      {/* Cabecera según §4.7 */}
      <header className="tutor-panel__header">
        <div className="tutor-panel__header-top">
          <div className="tutor-panel__title-wrap">
            <h2 className="tutor-panel__title">Tutor</h2>
            <span
              className={`tutor-panel__status-dot ${
                isAiUnavailable ? 'is-offline' : 'is-online'
              }`}
              title={
                isAiUnavailable
                  ? aiStatus.message || 'IA no disponible'
                  : `Conectado (${activeModelId})`
              }
              aria-hidden="true"
            />
          </div>

          <div className="tutor-panel__header-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              disabled={threadMessages.length === 0 && !errorState && !isBusy}
              ariaLabel="Nueva conversación"
              title="Nueva conversación"
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Nueva conversación</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClosePanel}
              ariaLabel="Cerrar tutor (Esc)"
              title="Cerrar (Esc)"
            >
              <X size={16} aria-hidden="true" />
              <span>Cerrar</span>
            </Button>
          </div>
        </div>

        <p
          className="tutor-panel__context-line"
          title={`Lección: ${lessonTitle} · ${activeSectionInfo.label}: ${activeSectionInfo.heading}`}
        >
          Lección: {lessonTitle} · {activeSectionInfo.label} (
          {activeSectionInfo.heading})
        </p>

        {/* Selector de modelo compacto: Rápido (Flash) vs Profundo (Argon) */}
        <div className="tutor-panel__toolbar">
          <div
            className="tutor-model-segmented"
            role="group"
            aria-label="Selector de modelo de IA"
          >
            <button
              type="button"
              className={`tutor-model-segmented__btn ${
                effectiveEngineMode !== 'deep' ? 'is-active' : ''
              }`.trim()}
              onClick={() => handleSelectEngineMode('fast')}
              aria-pressed={effectiveEngineMode !== 'deep'}
              title={`Modelo rápido: ${fastModelId}`}
            >
              <span>Rápido</span>
              <span className="tutor-model-segmented__id tabular" style={{ color: 'var(--text-2)' }}>Flash</span>
            </button>
            <button
              type="button"
              className={`tutor-model-segmented__btn ${
                effectiveEngineMode === 'deep' ? 'is-active' : ''
              }`.trim()}
              onClick={() => handleSelectEngineMode('deep')}
              aria-pressed={effectiveEngineMode === 'deep'}
              title={`Modelo profundo: ${deepModelId}`}
            >
              <span>Profundo</span>
              <span className="tutor-model-segmented__id tabular" style={{ color: 'var(--text-2)' }}>Argon</span>
            </button>
          </div>

          <span
            className="tutor-panel__active-model tabular"
            title={
              availableModels.length > 0
                ? `${availableModels.length} modelos disponibles en agy`
                : activeModelId
            }
          >
            {activeModelId}
          </span>
        </div>

        {/* Pestañas de funciones IA (Chat, Explícalo/Feynman, +3 preguntas, Entrevista) */}
        <nav className="tutor-panel__tabs" aria-label="Modos del tutor">
          {PANEL_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tutor-panel__tab ${active ? 'is-active' : ''}`.trim()}
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Estado honesto: IA no disponible */}
      {isAiUnavailable && (
        <div
          className="tutor-unavailable-card"
          role="region"
          aria-label="IA no disponible"
          data-testid="tutor-unavailable-card"
        >
          <div className="tutor-unavailable-card__head">
            <AlertCircle size={16} aria-hidden="true" />
            <div>
              <h3 className="tutor-unavailable-card__title">
                {prefs?.aiEnabled === false
                  ? 'El tutor IA está desactivado en tus preferencias'
                  : aiStatus.message ||
                    'No encuentro Antigravity (agy) en este equipo.'}
              </h3>
              <span className="tutor-unavailable-card__code tabular">
                Código: {prefs?.aiEnabled === false ? 'AI_DISABLED' : aiStatus.code || 'AGY_NOT_FOUND'}
              </span>
            </div>
          </div>

          {prefs?.aiEnabled === false ? (
            <div className="tutor-unavailable-card__body">
              <p>
                Has desactivado las funciones de IA. Puedes reactivarlas ahora mismo
                para volver a usar el tutor.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setPref('aiEnabled', true)}
              >
                Activar IA
              </Button>
            </div>
          ) : (
            <div className="tutor-unavailable-card__body">
              <p className="tutor-unavailable-card__fix">
                {aiStatus.fix ||
                  'Instala Antigravity o define la ruta del ejecutable en GRANO_AGY_PATH.'}
              </p>
              {Array.isArray(aiStatus.steps) && aiStatus.steps.length > 0 && (
                <ol className="tutor-honest-error__steps">
                  {aiStatus.steps.map((step, idx) => (
                    <li key={idx}>{formatInlineText(step)}</li>
                  ))}
                </ol>
              )}
              <div className="tutor-unavailable-card__actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={checkAiAvailability}
                  disabled={checkingStatus}
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  <span>
                    {checkingStatus ? 'Comprobando…' : 'Comprobar conexión'}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido principal según pestaña activa (se conservan montadas por lección para no perder estado) */}
      <div
        className="tutor-panel__scroll-body"
        hidden={activeTab !== 'feynman'}
        aria-hidden={activeTab !== 'feynman'}
      >
        <FeynmanRubricCard
          key={`feynman-${v2LessonId}`}
          lessonId={v2LessonId}
          lessonTitle={lessonTitle}
          sectionId={activeSectionInfo.id}
          objective={
            Array.isArray(resolvedLesson?.objectives)
              ? resolvedLesson.objectives[0]
              : resolvedLesson?.goal || ''
          }
          model={activeModelId}
          track={activeTrack}
          level={lessonLevel}
          disabled={isAiUnavailable}
        />
      </div>

      <div
        className="tutor-panel__scroll-body"
        hidden={activeTab !== 'quiz-more'}
        aria-hidden={activeTab !== 'quiz-more'}
      >
        <ExtraQuizCard
          key={`quiz-${v2LessonId}`}
          lessonId={v2LessonId}
          lessonTitle={lessonTitle}
          sectionId={activeSectionInfo.id}
          model={activeModelId}
          track={activeTrack}
          level={lessonLevel}
          disabled={isAiUnavailable}
          onExplainMistake={({ question, selectedOption, feedback }) => {
            setActiveTab('chat');
            setChatSubMode('explain-error');
            setAttachedSelection(
              `Pregunta: ${question}\nOpción elegida: ${selectedOption}\nNota: ${feedback}`
            );
            setInputValue(
              'No entiendo por qué mi respuesta no es correcta. Explícamelo con un ejemplo.'
            );
          }}
        />
      </div>

      <div
        className="tutor-panel__scroll-body"
        hidden={activeTab !== 'interview'}
        aria-hidden={activeTab !== 'interview'}
      >
        <InterviewSimulator
          key={`interview-${v2LessonId}`}
          lessonId={v2LessonId}
          defaultTrack={activeTrack}
          defaultLevel={lessonLevel}
          model={activeModelId}
          disabled={isAiUnavailable}
        />
      </div>

      {activeTab === 'chat' && (
        <>
          {/* Acciones rápidas de modo (explain-error, review-sql) */}
          <div className="tutor-chat-modes">
            <button
              type="button"
              className={`tutor-chat-modes__chip ${
                chatSubMode === 'tutor' ? 'is-active' : ''
              }`.trim()}
              onClick={() => {
                setChatSubMode('tutor');
                setShowCodeAttachmentBox(false);
              }}
            >
              Duda de la sección
            </button>
            <button
              type="button"
              className={`tutor-chat-modes__chip ${
                chatSubMode === 'explain-error' ? 'is-active' : ''
              }`.trim()}
              onClick={handlePrepareExplainError}
            >
              <FileWarning size={13} aria-hidden="true" />
              <span>Explicar error</span>
            </button>
            <button
              type="button"
              className={`tutor-chat-modes__chip ${
                chatSubMode === 'review-sql' ? 'is-active' : ''
              }`.trim()}
              onClick={handleLoadLessonSqlForReview}
            >
              <Code2 size={13} aria-hidden="true" />
              <span>Revisar SQL</span>
            </button>
          </div>

          {/* Lista de mensajes del hilo */}
          <div
            className="tutor-panel__messages"
            role="log"
            aria-label="Conversación con el tutor"
            aria-busy={isBusy}
          >
            {threadMessages.length === 0 && !isBusy && !errorState && (
              <div className="tutor-empty-thread">
                <p className="tutor-empty-thread__title">
                  Sin mensajes en esta lección.
                </p>
                <p className="tutor-empty-thread__sub">
                  Elige una sugerencia abajo o escribe tu pregunta sobre{' '}
                  <strong>{lessonTitle}</strong>. El servidor enviará el contexto de
                  la sección actual ({activeSectionInfo.heading}).
                </p>
              </div>
            )}

            {threadMessages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="tutor-msg-user">
                    {msg.chatMode && msg.chatMode !== 'tutor' && (
                      <span className="tutor-msg-user__mode tabular">
                        {msg.chatMode === 'explain-error'
                          ? 'Modo: explicar error'
                          : 'Modo: revisar SQL'}
                      </span>
                    )}
                    {msg.selection && (
                      <blockquote className="tutor-msg-user__quote">
                        {msg.selection}
                      </blockquote>
                    )}
                    {msg.code && (
                      <pre className="tutor-msg-user__code">
                        <code>{msg.code}</code>
                      </pre>
                    )}
                    <div className="tutor-msg-user__text">{msg.content}</div>
                  </div>
                );
              }

              return (
                <article
                  key={msg.id}
                  className="tutor-msg-assistant"
                  data-testid="tutor-msg-assistant"
                >
                  <div className="tutor-msg-assistant__meta tabular">
                    <span>{msg.model || activeModelId}</span>
                    {typeof msg.firstTokenMs === 'number' && (
                      <span>
                        1.º token {(msg.firstTokenMs / 1000).toFixed(1)} s
                      </span>
                    )}
                    {typeof msg.elapsedMs === 'number' && (
                      <span>total {(msg.elapsedMs / 1000).toFixed(1)} s</span>
                    )}
                    {msg.cached && <span>caché</span>}
                  </div>
                  <div className="tutor-msg-assistant__body">
                    {renderTutorMarkdown(msg.content, {
                      lessonId: v2LessonId,
                    })}
                  </div>
                </article>
              );
            })}

            {/* Estado honesto: En cola */}
            {streamPhase === 'queued' && (
              <div
                className="tutor-live-status"
                role="status"
                data-testid="tutor-queued-status"
              >
                <div className="tutor-live-status__main">
                  <span className="tutor-live-status__dot" aria-hidden="true" />
                  <span className="tabular">
                    En cola ({queuePosition || 1} por delante) · {elapsedSec} s
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleStopStream}
                  data-testid="tutor-stop-btn"
                >
                  <Square size={12} aria-hidden="true" />
                  <span>Detener</span>
                </Button>
              </div>
            )}

            {/* Estado honesto: Esperando primer token ("Pensando… X s") */}
            {streamPhase === 'waiting' && (
              <div
                className="tutor-live-status"
                role="status"
                data-testid="tutor-thinking-status"
              >
                <div className="tutor-live-status__main">
                  <span className="tutor-live-status__dot" aria-hidden="true" />
                  <span className="tabular">Pensando… {elapsedSec} s</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleStopStream}
                  data-testid="tutor-stop-btn"
                >
                  <Square size={12} aria-hidden="true" />
                  <span>Detener</span>
                </Button>
              </div>
            )}

            {/* Estado honesto: Streaming en curso con cursor de bloque fino */}
            {streamPhase === 'streaming' && (
              <article
                className="tutor-msg-assistant is-streaming"
                data-testid="tutor-streaming-msg"
              >
                <div className="tutor-msg-assistant__meta tabular">
                  <span>{streamMeta.model || activeModelId}</span>
                  {typeof streamMeta.firstTokenMs === 'number' && (
                    <span>
                      1.º token {(streamMeta.firstTokenMs / 1000).toFixed(1)} s
                    </span>
                  )}
                  <span>recibiendo… {elapsedSec} s</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleStopStream}
                    data-testid="tutor-stop-btn"
                  >
                    <Square size={12} aria-hidden="true" />
                    <span>Detener</span>
                  </Button>
                </div>
                <div className="tutor-msg-assistant__body">
                  {renderTutorMarkdown(streamingText, {
                    lessonId: v2LessonId,
                    isStreaming: true,
                  })}
                </div>
              </article>
            )}

            {/* Aviso cuando el usuario detuvo la consulta */}
            {stoppedNotice && !isBusy && (
              <div className="tutor-stopped-banner" role="status">
                <span className="tabular">{stoppedNotice}</span>
                {lastRequestPayload && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRetryLast}
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    <span>Reintentar</span>
                  </Button>
                )}
              </div>
            )}

            {/* Estado honesto: Error con pasos de solución y botón Reintentar */}
            {errorState && !isBusy && (
              <div
                className="tutor-honest-error"
                role="alert"
                data-testid="tutor-error-card"
              >
                <div className="tutor-honest-error__top">
                  <AlertCircle size={16} aria-hidden="true" />
                  <strong>{errorState.message}</strong>
                </div>
                {errorState.fix && (
                  <p className="tutor-honest-error__detail">{errorState.fix}</p>
                )}
                {Array.isArray(errorState.steps) && errorState.steps.length > 0 && (
                  <ol className="tutor-honest-error__steps">
                    {errorState.steps.map((step, idx) => (
                      <li key={idx}>{formatInlineText(step)}</li>
                    ))}
                  </ol>
                )}
                <div className="tutor-honest-error__actions">
                  <span className="tutor-honest-error__code tabular">
                    {errorState.code}
                  </span>
                  {lastRequestPayload && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleRetryLast}
                    >
                      <RotateCcw size={13} aria-hidden="true" />
                      <span>Reintentar</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Cita o código adjunto (desde openTutor o desde explain-error / review-sql) */}
          {(attachedSelection || showCodeAttachmentBox || attachedCode || attachedResult) && (
            <div className="tutor-attachments">
              {attachedSelection && (
                <div className="tutor-attachment-item">
                  <div className="tutor-attachment-item__head">
                    <span>Cita seleccionada</span>
                    <button
                      type="button"
                      className="tutor-attachment-item__remove"
                      onClick={() => setAttachedSelection('')}
                      aria-label="Quitar cita seleccionada"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="tutor-attachment-item__quote">
                    {attachedSelection}
                  </p>
                </div>
              )}

              {(showCodeAttachmentBox || attachedCode) && (
                <div className="tutor-attachment-item">
                  <div className="tutor-attachment-item__head">
                    <label htmlFor="tutor-attached-code">
                      {chatSubMode === 'review-sql'
                        ? 'Consulta SQL a revisar'
                        : 'Código o consulta adjunta'}
                    </label>
                    <button
                      type="button"
                      className="tutor-attachment-item__remove"
                      onClick={() => {
                        setAttachedCode('');
                        setShowCodeAttachmentBox(false);
                      }}
                      aria-label="Quitar código adjunto"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                  <textarea
                    id="tutor-attached-code"
                    className="tutor-attachment-item__code-input"
                    rows={3}
                    placeholder="SELECT ..."
                    value={attachedCode}
                    onChange={(e) => setAttachedCode(e.target.value)}
                  />
                </div>
              )}

              {attachedResult && (
                <div className="tutor-attachment-item">
                  <div className="tutor-attachment-item__head">
                    <span>Resultado o mensaje de error</span>
                    <button
                      type="button"
                      className="tutor-attachment-item__remove"
                      onClick={() => setAttachedResult('')}
                      aria-label="Quitar resultado adjunto"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                  <pre className="tutor-attachment-item__result">
                    <code>{attachedResult}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Sugerencias contextuales (máximo 3, Paso 5) */}
          <div
            className="tutor-panel__suggestions"
            aria-label="Sugerencias contextuales"
          >
            {contextualSuggestions.map((item) => (
              <button
                key={item.label}
                type="button"
                className="tutor-suggestion-chip"
                disabled={isBusy || isAiUnavailable}
                onClick={() =>
                  executeChatRequest({
                    questionText: item.prompt,
                    modeToUse: item.mode,
                    appendUserTurn: true,
                  })
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Formulario de entrada con foco automático al abrir */}
          <form className="tutor-panel__form" onSubmit={handleFormSubmit}>
            <div className="tutor-panel__input-wrap">
              <label htmlFor="tutor-question-textarea" className="tutor-sr-only">
                {activeSubModeInfo.label}
              </label>
              <textarea
                id="tutor-question-textarea"
                ref={textareaRef}
                className="tutor-panel__textarea"
                rows={2}
                placeholder={
                  isAiUnavailable
                    ? 'IA no disponible. Revisa las instrucciones de arriba.'
                    : activeSubModeInfo.placeholder
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                disabled={isAiUnavailable}
                aria-label="Pregunta para el tutor"
              />
            </div>

            {isBusy ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="tutor-panel__send-btn"
                onClick={handleStopStream}
                ariaLabel="Detener respuesta en curso"
                title="Detener"
              >
                <Square size={16} aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="tutor-panel__send-btn"
                disabled={isAiUnavailable || !inputValue.trim()}
                ariaLabel="Enviar pregunta al tutor"
                title={
                  isAiUnavailable
                    ? aiStatus.message || 'IA no disponible'
                    : 'Enviar pregunta (Enter)'
                }
              >
                <Send size={16} aria-hidden="true" />
              </Button>
            )}
          </form>
        </>
      )}
    </div>
  );
}

export default TutorPanel;
