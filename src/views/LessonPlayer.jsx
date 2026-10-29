import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import LessonVisualizer from '../components/LessonVisualizers.jsx';
import AuthenticCodeLab from '../components/AuthenticCodeLab.jsx';
import PipelineOrderChallenge from '../components/PipelineOrderChallenge.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import Kbd from '../components/ui/Kbd.jsx';
import {
  stripSectionNumber,
  formatInlineText,
  renderProseBody,
} from '../utils/formatText.jsx';
import {
  useProfile,
  useProgress,
  useTutorState,
  startLesson,
  setLessonStep,
  answerCheck as storeAnswerCheck,
  solvePractice as storeSolvePractice,
} from '../state/store.js';
import { LESSONS_BY_ID } from '../data/lessons/index.js';
import {
  normalizeLessonV2,
  buildLessonSyllabusItems,
  resolvePrerequisiteMeta,
} from './lesson/normalizeLessonV2.js';
import {
  InlineCodeExample,
  LessonWorkedExample,
} from './lesson/LessonWorkedExample.jsx';
import { LessonRoleNotes } from './lesson/LessonRoleNotes.jsx';
import { LessonCheckCard } from './lesson/LessonCheckCard.jsx';

export const LESSON_STEP_LABELS = [
  'Contexto y objetivos',
  'Desarrollo y simulador',
  'Ejemplo paso a paso',
  'Desde tu área',
  'Comprobaciones',
  'Práctica aplicada',
  'Resumen y fuentes',
];

export const LESSON_STEPS = [
  { id: 'contexto', label: 'Contexto y objetivos' },
  { id: 'desarrollo', label: 'Desarrollo y simulador' },
  { id: 'ejemplo-guiado', label: 'Ejemplo paso a paso' },
  { id: 'areas', label: 'Desde tu área' },
  { id: 'comprobaciones', label: 'Comprobaciones' },
  { id: 'practica', label: 'Práctica aplicada' },
  { id: 'resumen', label: 'Resumen y fuentes' },
];

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function LessonPlayer({
  lessons = [],
  currentLesson,
  prevLesson,
  nextLesson,
  completedIds = [],
  quizAnswers = {},
  completedLabIds = [],
  completedPipelineIds = [],
  onSelectQuizOption,
  onToggleCompleteLesson,
  onSolveLab,
  onSolvePipeline,
  onOpenLesson,
  onNavigate,
  onAskTutor,
  onOpenTutor,
}) {
  const profile = useProfile();
  const progress = useProgress();
  const tutorState = useTutorState();

  const [overrideTick, setOverrideTick] = useState(0);
  useEffect(() => {
    const handleCustomOverride = () => setOverrideTick((t) => t + 1);
    window.addEventListener('grano:lesson-override', handleCustomOverride);
    return () => window.removeEventListener('grano:lesson-override', handleCustomOverride);
  }, []);

  const lesson = useMemo(
    () => normalizeLessonV2(currentLesson),
    [currentLesson, overrideTick]
  );

  const lessonId = lesson?.id || '';
  const storedLessonProgress = progress?.lessons?.[lessonId] || null;

  // Estado local de respuestas de comprobaciones (sincronizado con store y props legacy)
  const [localCheckAnswers, setLocalCheckAnswers] = useState({});
  const [hasReachedReadingEnd, setHasReachedReadingEnd] = useState(false);
  const [hasSubmittedPractice, setHasSubmittedPractice] = useState(false);
  const [completionBlockedMsg, setCompletionBlockedMsg] = useState('');

  // Estado de navegación y paneles
  const [activeSectionId, setActiveSectionId] = useState('contexto');
  const [scrollPercent, setScrollPercent] = useState(8);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(true);
  const [isMobileSyllabusOpen, setIsMobileSyllabusOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  // Estado para selección de texto -> botón flotante "Preguntar" (Paso 5)
  const [selectionPopup, setSelectionPopup] = useState(null);

  const readingColRef = useRef(null);
  const readingEndSentinelRef = useRef(null);
  const programmaticScrollUntilRef = useRef(0);

  useEffect(() => {
    if (!lessonId) return;
    startLesson(lessonId);
    setCompletionBlockedMsg('');
    setSelectionPopup(null);

    try {
      const savedEnd = window.sessionStorage.getItem(`grano_read_end_${lessonId}`);
      setHasReachedReadingEnd(savedEnd === '1');
      const savedPrac = window.sessionStorage.getItem(`grano_prac_sub_${lessonId}`);
      setHasSubmittedPractice(savedPrac === '1');
    } catch {
      setHasReachedReadingEnd(false);
      setHasSubmittedPractice(false);
    }
  }, [lessonId, startLesson]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Combinar respuestas guardadas en store + local + quizAnswers legacy
  const effectiveCheckAnswers = useMemo(() => {
    const combined = {
      ...(storedLessonProgress?.checksAnswered || {}),
      ...(localCheckAnswers[lessonId] || {}),
    };
    const checks = lesson?.checks || [];
    if (
      checks.length > 0 &&
      quizAnswers &&
      quizAnswers[lessonId] !== undefined &&
      !combined[checks[0].id]
    ) {
      const firstCheck = checks[0];
      const optIdx = quizAnswers[lessonId];
      const opt = firstCheck.options?.[optIdx];
      if (opt) {
        combined[firstCheck.id] = {
          answered: true,
          optionId: opt.id || `opt-${optIdx}`,
          optionIndex: optIdx,
          optionText: opt.text,
          correct: opt.id
            ? opt.id === firstCheck.correctOptionId
            : Boolean(opt.correct),
        };
      }
    }
    return combined;
  }, [storedLessonProgress, localCheckAnswers, lessonId, lesson, quizAnswers]);

  const totalChecksCount = Array.isArray(lesson?.checks) ? lesson.checks.length : 0;
  const answeredChecksCount = useMemo(() => {
    if (!Array.isArray(lesson?.checks)) return 0;
    return lesson.checks.filter((chk) => Boolean(effectiveCheckAnswers[chk.id]?.answered)).length;
  }, [lesson, effectiveCheckAnswers]);

  const isLessonCompleted = completedIds.includes(lessonId) || storedLessonProgress?.status === 'completed';
  const isLabSolved =
    completedLabIds.includes(lessonId) || Boolean(storedLessonProgress?.practiceSolved);
  const isPipelineSolved = completedPipelineIds.includes(lessonId);

  const hasPracticeBlock = Boolean(lesson?.practice);
  const isPracticeSubmittedEffective =
    !hasPracticeBlock || isLabSolved || hasSubmittedPractice || isLessonCompleted;
  const isReadingEndEffective = hasReachedReadingEnd || isLessonCompleted;
  const allChecksAnswered = answeredChecksCount >= totalChecksCount;

  const canCompleteLesson =
    isReadingEndEffective && allChecksAnswered && isPracticeSubmittedEffective;

  const syllabusItems = useMemo(
    () =>
      buildLessonSyllabusItems(lesson, {
        answeredChecksCount,
        isPracticeSubmitted: isPracticeSubmittedEffective,
      }),
    [lesson, answeredChecksCount, isPracticeSubmittedEffective]
  );

  // Determinar si el temario cabe inline sin apretar la columna de lectura por debajo de 640px
  const isTutorOpen = Boolean(tutorState?.isOpen);
  const canShowInlineSyllabus =
    viewportWidth >= 1200 && (!isTutorOpen || viewportWidth >= 1600);

  const scrollToSection = useCallback(
    (sectionId, focusHeading = false) => {
      const item =
        syllabusItems.find((it) => it.id === sectionId || it.domId === sectionId) ||
        null;
      const domId = item ? item.domId : `sec-${sectionId}`;
      const el = document.getElementById(domId);
      if (!el) return;

      const cleanId = item ? item.id : sectionId;
      programmaticScrollUntilRef.current = Date.now() + 700;
      setActiveSectionId(cleanId);

      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      el.scrollIntoView({ behavior, block: 'start' });
      const itemIdx = syllabusItems.findIndex((it) => it.id === cleanId);
      if (lessonId && itemIdx >= 0) {
        setLessonStep(lessonId, itemIdx, cleanId);
      }

      if (cleanId === 'resumen') {
        setHasReachedReadingEnd(true);
        try {
          window.sessionStorage.setItem(`grano_read_end_${lessonId}`, '1');
        } catch {
          // ignore
        }
      }

      if (focusHeading) {
        const heading = el.querySelector('h2, h1, h3');
        if (heading) {
          heading.focus({ preventScroll: true });
        }
      }
    },
    [syllabusItems, lessonId, setLessonStep]
  );

  // Observar secciones visibles y el centinela de fin de lectura
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const sectionElements = Array.from(
      document.querySelectorAll('.lp-reading-col [data-section-id]')
    );
    if (sectionElements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < programmaticScrollUntilRef.current) {
          return;
        }
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const topId = visible[0].target.getAttribute('data-section-id');
          if (topId) {
            setActiveSectionId(topId);
            if (topId === 'resumen') {
              setHasReachedReadingEnd(true);
              try {
                window.sessionStorage.setItem(`grano_read_end_${lessonId}`, '1');
              } catch {
                // ignore
              }
            }
          }
        }
      },
      {
        rootMargin: '-12% 0px -62% 0px',
        threshold: [0, 0.15, 0.5],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lessonId, syllabusItems.length]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !readingEndSentinelRef.current) {
      return undefined;
    }
    const endObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHasReachedReadingEnd(true);
          try {
            window.sessionStorage.setItem(`grano_read_end_${lessonId}`, '1');
          } catch {
            // ignore
          }
        }
      },
      { rootMargin: '0px 0px 120px 0px', threshold: 0.05 }
    );
    endObserver.observe(readingEndSentinelRef.current);
    return () => endObserver.disconnect();
  }, [lessonId]);

  // Actualizar barra única de progreso de lectura (2px) al hacer scroll
  useEffect(() => {
    const updateScrollProgress = () => {
      if (!readingColRef.current) return;
      const rect = readingColRef.current.getBoundingClientRect();
      const totalScrollable = Math.max(1, rect.height - window.innerHeight * 0.65);
      const scrolled = Math.max(0, -rect.top + window.innerHeight * 0.25);
      const ratio = Math.min(100, Math.max(6, Math.round((scrolled / totalScrollable) * 100)));
      setScrollPercent(ratio);
      if (ratio >= 92) {
        setHasReachedReadingEnd(true);
        try {
          window.sessionStorage.setItem(`grano_read_end_${lessonId}`, '1');
        } catch {
          // ignore
        }
      }
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, [lessonId]);

  // Invocar al tutor contextualizado
  const triggerTutor = useCallback(
    (payload = {}) => {
      const fullPayload = {
        mode: payload.mode || 'tutor',
        lessonId,
        sectionId: payload.sectionId || activeSectionId || 'contexto',
        selection: payload.selection || '',
        code: payload.code || '',
        result: payload.result || '',
        prefill: payload.prefill || '',
      };

      if (onOpenTutor) {
        onOpenTutor(fullPayload);
      } else if (onAskTutor) {
        onAskTutor(fullPayload.prefill || fullPayload.selection || '');
      }
    },
    [lessonId, activeSectionId, onOpenTutor, onAskTutor]
  );

  // Paso 5 — Selección de texto -> botón flotante "Preguntar"
  useEffect(() => {
    const handleSelectionCheck = () => {
      if (typeof window === 'undefined' || !window.getSelection) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelectionPopup(null);
        return;
      }

      const rawText = sel.toString().trim();
      if (rawText.length < 4 || rawText.length > 600) {
        setSelectionPopup(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const container = readingColRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelectionPopup(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelectionPopup(null);
        return;
      }

      const clampedX = Math.min(
        Math.max(rect.left + rect.width / 2, 88),
        window.innerWidth - 110
      );
      const posY = rect.top > 72 ? rect.top - 10 : rect.bottom + 36;

      setSelectionPopup({
        text: rawText,
        x: Math.round(clampedX),
        y: Math.round(posY),
      });
    };

    const handleMouseUp = () => {
      setTimeout(handleSelectionCheck, 15);
    };

    const handleScrollHide = () => {
      setSelectionPopup((prev) => (prev ? null : prev));
    };

    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('scroll', handleScrollHide, { passive: true });
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScrollHide);
    };
  }, []);

  // Paso 7 — Atajos de teclado de la lección (J/K, T, /, ?)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'Escape' && selectionPopup) {
        setSelectionPopup(null);
        return;
      }

      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const curIdx = syllabusItems.findIndex((it) => it.id === activeSectionId);
        const nextIdx = Math.min(
          syllabusItems.length - 1,
          curIdx >= 0 ? curIdx + 1 : 1
        );
        if (syllabusItems[nextIdx]) {
          scrollToSection(syllabusItems[nextIdx].id, true);
        }
        return;
      }

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const curIdx = syllabusItems.findIndex((it) => it.id === activeSectionId);
        const prevIdx = Math.max(0, curIdx > 0 ? curIdx - 1 : 0);
        if (syllabusItems[prevIdx]) {
          scrollToSection(syllabusItems[prevIdx].id, true);
        }
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        if (canShowInlineSyllabus) {
          setIsSyllabusOpen((prev) => !prev);
        } else {
          setIsMobileSyllabusOpen((prev) => !prev);
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        triggerTutor({
          mode: 'tutor',
          sectionId: activeSectionId,
        });
        setTimeout(() => {
          const input = document.querySelector('.tutor-input-textarea');
          if (input) input.focus();
        }, 60);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    syllabusItems,
    activeSectionId,
    canShowInlineSyllabus,
    scrollToSection,
    triggerTutor,
    selectionPopup,
  ]);

  const handleToggleSyllabus = () => {
    if (canShowInlineSyllabus) {
      setIsSyllabusOpen((prev) => !prev);
    } else {
      setIsMobileSyllabusOpen((prev) => !prev);
    }
  };

  const handleAnswerCheck = (checkId, answerPayload) => {
    setLocalCheckAnswers((prev) => ({
      ...prev,
      [lessonId]: {
        ...(prev[lessonId] || {}),
        [checkId]: answerPayload,
      },
    }));

    storeAnswerCheck(lessonId, checkId, {
      optionId: answerPayload.optionId,
      correct: answerPayload.correct,
    });

    // Sincronizar con el primer check legacy para estadísticas globales
    if (
      onSelectQuizOption &&
      lesson?.checks?.[0]?.id === checkId &&
      typeof answerPayload.optionIndex === 'number'
    ) {
      onSelectQuizOption(lessonId, answerPayload.optionIndex);
    }
  };

  const markPracticeAttempted = useCallback(() => {
    setHasSubmittedPractice(true);
    try {
      window.sessionStorage.setItem(`grano_prac_sub_${lessonId}`, '1');
    } catch {
      // ignore
    }
  }, [lessonId]);

  const handleSolvePracticeLab = () => {
    markPracticeAttempted();
    storeSolvePractice(lessonId);
    if (onSolveLab) {
      onSolveLab(lessonId);
    }
  };

  const handleAttemptCompleteLesson = () => {
    if (isLessonCompleted) {
      if (onToggleCompleteLesson) {
        onToggleCompleteLesson(lessonId);
      }
      return;
    }

    const missing = [];
    if (!isReadingEndEffective) {
      missing.push('llegar al resumen final de la lectura');
    }
    if (!allChecksAnswered) {
      const remaining = totalChecksCount - answeredChecksCount;
      missing.push(
        `responder ${remaining} ${remaining === 1 ? 'comprobación pendiente' : 'comprobaciones pendientes'}`
      );
    }
    if (!isPracticeSubmittedEffective) {
      missing.push('enviar un intento en la práctica aplicada');
    }

    if (missing.length > 0) {
      setCompletionBlockedMsg(
        `Para marcar esta lección como completada falta: ${missing.join(', ')}.`
      );
      return;
    }

    setCompletionBlockedMsg('');
    if (onToggleCompleteLesson) {
      onToggleCompleteLesson(lessonId);
    }
  };

  // Construir objeto challenge compatible con AuthenticCodeLab si lesson.practice existe
  const codeLabChallenge = useMemo(() => {
    if (!lesson || !lesson.practice) return null;
    const rawBlanks = Array.isArray(lesson.practice.blanks) ? lesson.practice.blanks : [];
    if (rawBlanks.length === 0) return null;

    const templateSql = String(
      lesson.practice.starterCode ||
        lesson.practice.templateCode ||
        lesson.practice.solution ||
        ''
    );
    const blanks = rawBlanks.map((b, idx) => {
      const num = idx + 1;
      const blankId = b.id || `b${num}`;
      const accepted = Array.isArray(b.acceptedAnswers)
        ? b.acceptedAnswers
        : b.answer
          ? [b.answer]
          : [];
      return {
        id: blankId,
        placeholder: b.placeholder || b.label || `Espacio ${num}`,
        acceptedAnswers: accepted,
        hint: b.hint || lesson.practice.hints?.[idx] || '',
      };
    });

    return {
      title: lesson.practice.title || 'Completa la consulta SQL',
      language: lesson.practice.language || 'sql',
      instruction: lesson.practice.prompt || lesson.practice.instruction || '',
      description: lesson.practice.prompt || lesson.practice.description || '',
      templateCode: templateSql,
      template: templateSql,
      blanks,
      expectedOutput: lesson.practice.solutionExplanation || '',
      expectedOutputTable: Array.isArray(lesson.practice.expectedOutputTable)
        ? lesson.practice.expectedOutputTable
        : Array.isArray(lesson.practice.expectedOutput)
          ? lesson.practice.expectedOutput
          : [],
      rubricCriteria: Array.isArray(lesson.practice.rubricCriteria)
        ? lesson.practice.rubricCriteria
        : [],
    };
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="lesson-player">
        <p className="prose-p">Selecciona una lección para comenzar.</p>
      </div>
    );
  }

  const activeSyllabusIndex = Math.max(
    0,
    syllabusItems.findIndex((it) => it.id === activeSectionId)
  );
  const activeSyllabusItem = syllabusItems[activeSyllabusIndex] || syllabusItems[0];

  const renderSyllabusNav = (onItemClick) => (
    <nav className="lp-syllabus-nav" aria-label="Temario de la lección">
      <div className="lp-syllabus-nav__head">
        <span className="lp-syllabus-nav__title">En esta lección</span>
        <span className="lp-syllabus-nav__count tabular">
          {activeSyllabusIndex + 1}/{syllabusItems.length}
        </span>
      </div>
      <ol className="lp-syllabus-list">
        {syllabusItems.map((item, idx) => {
          const isCurrent = item.id === activeSectionId;
          return (
            <li key={item.id} className="lp-syllabus-list__item">
              <button
                type="button"
                className={`lp-syllabus-link${isCurrent ? ' is-active' : ''}${
                  item.isDone ? ' is-done' : ''
                }`}
                aria-current={isCurrent ? 'location' : undefined}
                onClick={() => {
                  scrollToSection(item.id, true);
                  if (onItemClick) onItemClick();
                }}
              >
                <span className="lp-syllabus-link__num tabular">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="lp-syllabus-link__label">{item.label}</span>
                {item.meta ? (
                  <span className="lp-syllabus-link__meta tabular">{item.meta}</span>
                ) : item.hasInteractive ? (
                  <span className="lp-syllabus-link__tag">Lab</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return (
    <div className="lesson-player">
      {/* Barra superior compacta + 1 único indicador de progreso de 2px */}
      <header className="lp-topbar">
        <div className="lp-topbar__row">
          <div className="lp-topbar__left">
            <button
              type="button"
              className="lp-topbar__btn"
              onClick={() => (onNavigate ? onNavigate('roadmap') : null)}
            >
              ← Ruta
            </button>
            <button
              type="button"
              className={`lp-topbar__btn${
                (canShowInlineSyllabus && isSyllabusOpen) || isMobileSyllabusOpen
                  ? ' is-active'
                  : ''
              }`}
              aria-expanded={
                canShowInlineSyllabus ? isSyllabusOpen : isMobileSyllabusOpen
              }
              onClick={handleToggleSyllabus}
            >
              <span>Temario</span>
              <Kbd>T</Kbd>
            </button>
          </div>

          <div className="lp-topbar__center">
            <span className="lp-topbar__section-indicator tabular">
              Sección {activeSyllabusIndex + 1} de {syllabusItems.length}
              {activeSyllabusItem ? ` · ${activeSyllabusItem.label}` : ''}
            </span>
          </div>

          <div className="lp-topbar__right">
            <button
              type="button"
              className="lp-topbar__btn"
              onClick={() =>
                triggerTutor({
                  mode: 'tutor',
                  sectionId: activeSectionId,
                })
              }
            >
              <span>Preguntar</span>
              <Kbd>/</Kbd>
            </button>
            <button
              type="button"
              className="lp-topbar__btn lp-topbar__btn--icon"
              aria-label="Atajos de teclado de la lección"
              title="Atajos de teclado (?)"
              onClick={() => setIsShortcutsOpen(true)}
            >
              <Kbd>?</Kbd>
            </button>
          </div>
        </div>

        <div className="lp-topbar__progress">
          <ProgressBar
            value={isLessonCompleted ? 100 : scrollPercent}
            max={100}
            thickness={2}
            label="Progreso de lectura de la lección"
          />
        </div>
      </header>

      {/* Área de trabajo principal: Temario colapsable + Columna central de lectura */}
      <div
        className={`lp-workspace${
          canShowInlineSyllabus && isSyllabusOpen ? ' has-inline-syllabus' : ''
        }`}
      >
        {canShowInlineSyllabus && isSyllabusOpen ? (
          <aside className="lp-syllabus-rail">
            {renderSyllabusNav()}
          </aside>
        ) : null}

        <article
          ref={readingColRef}
          className="lp-reading-col"
          aria-label={lesson.title}
        >
          {/* Cabecera editorial sobria */}
          <header className="lp-header">
            <div className="lp-breadcrumb">
              <button
                type="button"
                className="lp-breadcrumb__link"
                onClick={() => (onNavigate ? onNavigate('roadmap') : null)}
              >
                {lesson.trackMeta?.shortName || 'Ruta'}
              </button>
              <span className="lp-breadcrumb__sep" aria-hidden="true">
                ›
              </span>
              <span className="lp-breadcrumb__current">
                {lesson.moduleMeta?.title || 'Módulo técnico'}
              </span>
            </div>

            <h1 className="lp-title">{lesson.title}</h1>

            <div className="lp-meta-line tabular">
              <span>{lesson.minutes} min</span>
              <span aria-hidden="true">·</span>
              <span>
                Nivel {lesson.level} ({lesson.levelName})
              </span>
              {lesson.prerequisites.length > 0 ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="lp-meta-prereq">
                    Recomendado antes:{' '}
                    {lesson.prerequisites.map((prereqId, idx) => {
                      const prereqMeta = resolvePrerequisiteMeta(prereqId);
                      if (!prereqMeta) return null;
                      return (
                        <React.Fragment key={prereqId}>
                          {idx > 0 ? ', ' : ''}
                          {prereqMeta.isAvailable ? (
                            <button
                              type="button"
                              className="lp-inline-lesson-link"
                              onClick={() =>
                                onOpenLesson ? onOpenLesson(prereqMeta.id) : null
                              }
                            >
                              {prereqMeta.title}
                            </button>
                          ) : (
                            <span className="lp-meta-prereq__text">
                              {prereqMeta.title}
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </span>
                </>
              ) : null}
            </div>
          </header>

          {/* Bloque 1: Contexto (Hook completo sin truncar) y Objetivos */}
          <section
            id="sec-contexto"
            data-section-id="contexto"
            className="lp-section lp-intro-section"
            aria-label="Contexto y objetivos de aprendizaje"
          >
            {lesson.hook ? (
              <div className="lp-hook">
                <span className="lp-hook__kicker">Escenario real</span>
                <p className="lp-hook__text">
                  {formatInlineText(lesson.hook, 'lp-hook')}
                </p>
              </div>
            ) : null}

            {Array.isArray(lesson.objectives) && lesson.objectives.length > 0 ? (
              <div className="lp-objectives">
                <h2 className="lp-objectives__title" tabIndex={-1}>
                  Objetivos de la lección
                </h2>
                <ul className="lp-objectives__list">
                  {lesson.objectives.map((obj, idx) => (
                    <li key={`obj-${idx}`} className="lp-objectives__item">
                      <span className="lp-objectives__num tabular">
                        0{idx + 1}
                      </span>
                      <span className="lp-objectives__text">
                        {formatInlineText(obj, `obj-txt-${idx}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Bloque 2: Secciones continuas con prosa, glosario, simulador y ejemplo */}
          {(lesson.sections || []).map((sec, idx) => {
            const secId = sec.id || `seccion-${idx + 1}`;
            const cleanHeading =
              stripSectionNumber(sec.heading || sec.title) || `Sección ${idx + 1}`;

            return (
              <section
                key={secId}
                id={`sec-${secId}`}
                data-section-id={secId}
                className="lp-section"
                aria-labelledby={`heading-${secId}`}
              >
                <div className="lp-section__head">
                  <div className="lp-section__title-row">
                    <span className="lp-section__num tabular">
                      Sección {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h2
                      id={`heading-${secId}`}
                      className="lp-section__title"
                      tabIndex={-1}
                    >
                      {cleanHeading}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="lp-ghost-action"
                    onClick={() =>
                      triggerTutor({
                        mode: 'tutor',
                        sectionId: secId,
                        selection: cleanHeading,
                        prefill: `Tengo una duda sobre la sección "${cleanHeading}" de la lección "${lesson.title}".`,
                      })
                    }
                  >
                    Preguntar sobre esta sección
                  </button>
                </div>

                <div className="lp-prose">
                  {renderProseBody(sec.body, `sec-body-${secId}`, {
                    enableGlossary: true,
                    glossaryTerms: lesson.glossaryTerms,
                  })}
                </div>

                {sec.interactive?.component ? (
                  <div className="lp-wide-block lp-simulator-frame">
                    <div className="lp-simulator-frame__head">
                      <div className="lp-simulator-frame__titles">
                        <span className="lp-simulator-frame__kicker">
                          Simulador interactivo en línea
                        </span>
                        {sec.interactive.caption ? (
                          <p className="lp-simulator-frame__caption">
                            {formatInlineText(
                              sec.interactive.caption,
                              `sim-cap-${secId}`
                            )}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="lp-ghost-action"
                        onClick={() =>
                          triggerTutor({
                            mode: 'free',
                            sectionId: secId,
                            selection:
                              sec.interactive.caption || cleanHeading,
                            prefill: `Explícame qué observar en el simulador interactivo de la sección "${cleanHeading}".`,
                          })
                        }
                      >
                        Guiarme en el simulador
                      </button>
                    </div>
                    <div className="lp-simulator-frame__body">
                      <LessonVisualizer visualType={sec.interactive.component} />
                    </div>
                  </div>
                ) : null}

                {sec.example?.code ? (
                  <InlineCodeExample
                    example={sec.example}
                    sectionId={secId}
                    onAskTutor={triggerTutor}
                  />
                ) : null}
              </section>
            );
          })}

          {/* Bloque 3: Ejemplo guiado paso a paso (antipatrón vs. solución) */}
          {lesson.workedExample?.steps?.length > 0 ? (
            <LessonWorkedExample
              workedExample={lesson.workedExample}
              onAskTutor={triggerTutor}
            />
          ) : null}

          {/* Bloque 4: Paso 4 — Perspectiva por rol ("Desde tu área") */}
          <LessonRoleNotes
            roleNotes={lesson.roleNotes}
            profileTrack={profile?.track}
          />

          {/* Bloque 5: Paso 3 — Comprobaciones integradas en el flujo */}
          {Array.isArray(lesson.checks) && lesson.checks.length > 0 ? (
            <section
              id="sec-comprobaciones"
              data-section-id="comprobaciones"
              className="lp-section lp-checks-section"
              aria-labelledby="lp-checks-heading"
            >
              <div className="lp-section__head">
                <div className="lp-section__title-row">
                  <span className="lp-section__kicker">
                    Verificación conceptual
                  </span>
                  <h2
                    id="lp-checks-heading"
                    className="lp-section__title"
                    tabIndex={-1}
                  >
                    Comprueba lo aprendido
                  </h2>
                </div>
                <span className="lp-checks-counter tabular">
                  {answeredChecksCount} de {lesson.checks.length} respondidas
                </span>
              </div>

              <div className="lp-checks-stack">
                {lesson.checks.map((chk, chkIdx) => (
                  <LessonCheckCard
                    key={chk.id || `chk-${chkIdx}`}
                    check={chk}
                    index={chkIdx}
                    total={lesson.checks.length}
                    savedAnswer={effectiveCheckAnswers[chk.id]}
                    onAnswer={handleAnswerCheck}
                    onAskTutor={triggerTutor}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Bloque 6: Práctica aplicada */}
          {lesson.practice || lesson.pipelineChallenge ? (
            <section
              id="sec-practica"
              data-section-id="practica"
              className="lp-section lp-practice-section"
              aria-labelledby="lp-practice-heading"
              onClickCapture={(e) => {
                const btn = e.target?.closest?.('button');
                if (
                  btn &&
                  /ejecutar|verificar|comprobar|validar|enviar/i.test(
                    btn.textContent || ''
                  )
                ) {
                  markPracticeAttempted();
                }
              }}
            >
              <div className="lp-section__head">
                <div className="lp-section__title-row">
                  <span className="lp-section__kicker">
                    Resolución práctica
                  </span>
                  <h2
                    id="lp-practice-heading"
                    className="lp-section__title"
                    tabIndex={-1}
                  >
                    Práctica aplicada
                  </h2>
                </div>
                <span className="lp-checks-counter tabular">
                  {isLabSolved
                    ? 'Resuelta correctamente'
                    : isPracticeSubmittedEffective
                      ? 'Intento registrado'
                      : 'Pendiente de envío'}
                </span>
              </div>

              {(codeLabChallenge && codeLabChallenge.blanks?.length > 0) ||
              lesson.practice?.type === 'sql' ? (
                <div className="lp-wide-block">
                  <AuthenticCodeLab
                    lessonId={lesson.id || lessonId}
                    practice={lesson.practice}
                    challenge={codeLabChallenge}
                    onSolve={handleSolvePracticeLab}
                    onAskAiTutor={(promptText) =>
                      triggerTutor({
                        mode: 'hint',
                        sectionId: 'practica',
                        selection: lesson.practice?.prompt || '',
                        code: lesson.practice?.starterCode || '',
                        prefill: promptText,
                      })
                    }
                  />
                </div>
              ) : lesson.practice ? (
                <div className="lp-custom-practice-card">
                  <p className="lp-custom-practice-card__prompt">
                    {formatInlineText(
                      lesson.practice.prompt || 'Resuelve el ejercicio práctico.',
                      'prac-custom-prompt'
                    )}
                  </p>
                  {lesson.practice.starterCode ? (
                    <pre className="lp-code-example__pre">
                      <code>{lesson.practice.starterCode}</code>
                    </pre>
                  ) : null}
                  <div className="lp-custom-practice-card__actions">
                    <button
                      type="button"
                      className="lp-btn lp-btn--primary"
                      onClick={handleSolvePracticeLab}
                    >
                      {isPracticeSubmittedEffective
                        ? 'Práctica enviada'
                        : 'Enviar solución de práctica'}
                    </button>
                  </div>
                </div>
              ) : null}

              {lesson.pipelineChallenge ? (
                <div className="lp-wide-block lp-pipeline-wrap">
                  <PipelineOrderChallenge
                    challenge={lesson.pipelineChallenge}
                    onComplete={() => {
                      markPracticeAttempted();
                      if (onSolvePipeline) onSolvePipeline(lessonId);
                    }}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Bloque 7: Resumen, Fuentes y Cierre honesto */}
          <section
            id="sec-resumen"
            data-section-id="resumen"
            className="lp-section lp-summary-section"
            aria-labelledby="lp-summary-heading"
          >
            <div className="lp-section__head">
              <div className="lp-section__title-row">
                <span className="lp-section__kicker">Síntesis técnica</span>
                <h2
                  id="lp-summary-heading"
                  className="lp-section__title"
                  tabIndex={-1}
                >
                  Lo que debes recordar
                </h2>
              </div>
            </div>

            {Array.isArray(lesson.summary) && lesson.summary.length > 0 ? (
              <ol className="lp-summary-list">
                {lesson.summary.map((point, idx) => (
                  <li key={`sum-${idx}`} className="lp-summary-list__item">
                    <span className="lp-summary-list__num tabular">
                      0{idx + 1}
                    </span>
                    <span className="lp-summary-list__text">
                      {formatInlineText(point, `sum-txt-${idx}`)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}

            {Array.isArray(lesson.relatedLessons) &&
            lesson.relatedLessons.length > 0 ? (
              <div className="lp-related-block">
                <h3 className="lp-related-block__title">
                  Lecciones conectadas en el catálogo
                </h3>
                <div className="lp-related-block__links">
                  {lesson.relatedLessons.map((relEntry, idx) => {
                    const relId =
                      typeof relEntry === 'string'
                        ? relEntry
                        : relEntry?.id || '';
                    const relReason =
                      typeof relEntry === 'object' && relEntry?.reason
                        ? relEntry.reason
                        : '';
                    if (!relId) return null;
                    const relLesson =
                      LESSONS_BY_ID[relId] ||
                      lessons.find(
                        (l) => l.id === relId || l.legacyId === relId
                      );
                    if (!relLesson) return null;
                    const targetId = relLesson.legacyId || relLesson.id;
                    return (
                      <button
                        key={`${relId}-${idx}`}
                        type="button"
                        className="lp-related-chip"
                        onClick={() =>
                          onOpenLesson ? onOpenLesson(targetId) : null
                        }
                      >
                        <span className="lp-related-chip__body">
                          <span className="lp-related-chip__title">
                            {relLesson.title}
                          </span>
                          {relReason ? (
                            <span className="lp-related-chip__reason">
                              {relReason}
                            </span>
                          ) : null}
                        </span>
                        <span className="lp-related-chip__arrow" aria-hidden="true">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {Array.isArray(lesson.sources) && lesson.sources.length > 0 ? (
              <details className="lp-sources">
                <summary className="lp-sources__summary">
                  <span>
                    Fuentes y documentación oficial ({lesson.sources.length})
                  </span>
                </summary>
                <ul className="lp-sources__list">
                  {lesson.sources.map((src, idx) => (
                    <li key={`src-${idx}`} className="lp-sources__item">
                      <div className="lp-sources__row">
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lp-sources__link"
                        >
                          {src.title}
                        </a>
                        {src.publisher ? (
                          <span className="lp-sources__pub">
                            {src.publisher}
                          </span>
                        ) : null}
                      </div>
                      {src.supports ? (
                        <p className="lp-sources__supports">{src.supports}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            <div
              ref={readingEndSentinelRef}
              className="lp-reading-sentinel"
              aria-hidden="true"
            />
          </section>

          {/* Pie de lección con regla honesta de completado (Paso 8) */}
          <footer className="lp-footer" aria-label="Cierre y navegación de lección">
            <div className="lp-completion-box">
              <div className="lp-completion-box__info">
                <h3 className="lp-completion-box__title">
                  {isLessonCompleted
                    ? 'Lección completada'
                    : 'Requisitos para completar la lección'}
                </h3>
                <ul className="lp-completion-reqs">
                  <li
                    className={`lp-completion-req${
                      isReadingEndEffective ? ' is-done' : ''
                    }`}
                  >
                    <span className="lp-completion-req__dot" aria-hidden="true">
                      {isReadingEndEffective ? '✓' : '·'}
                    </span>
                    <span>Lectura hasta el final</span>
                  </li>
                  {totalChecksCount > 0 ? (
                    <li
                      className={`lp-completion-req${
                        allChecksAnswered ? ' is-done' : ''
                      }`}
                    >
                      <span className="lp-completion-req__dot" aria-hidden="true">
                        {allChecksAnswered ? '✓' : '·'}
                      </span>
                      <span className="tabular">
                        Comprobaciones ({answeredChecksCount}/{totalChecksCount})
                      </span>
                    </li>
                  ) : null}
                  {hasPracticeBlock ? (
                    <li
                      className={`lp-completion-req${
                        isPracticeSubmittedEffective ? ' is-done' : ''
                      }`}
                    >
                      <span className="lp-completion-req__dot" aria-hidden="true">
                        {isPracticeSubmittedEffective ? '✓' : '·'}
                      </span>
                      <span>Práctica enviada</span>
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="lp-completion-box__action">
                <button
                  type="button"
                  className={`lp-btn ${
                    isLessonCompleted
                      ? 'lp-btn--completed'
                      : canCompleteLesson
                        ? 'lp-btn--primary'
                        : 'lp-btn--secondary'
                  }`}
                  onClick={handleAttemptCompleteLesson}
                >
                  {isLessonCompleted
                    ? 'Completada ✓'
                    : 'Completar lección'}
                </button>
              </div>
            </div>

            {completionBlockedMsg && !isLessonCompleted ? (
              <div className="lp-completion-alert" role="status">
                <p className="lp-completion-alert__text">
                  {completionBlockedMsg}
                </p>
                <div className="lp-completion-alert__links">
                  {!allChecksAnswered ? (
                    <button
                      type="button"
                      className="lp-ghost-action"
                      onClick={() => scrollToSection('comprobaciones', true)}
                    >
                      Ir a comprobaciones ({answeredChecksCount}/{totalChecksCount})
                    </button>
                  ) : null}
                  {!isPracticeSubmittedEffective ? (
                    <button
                      type="button"
                      className="lp-ghost-action"
                      onClick={() => scrollToSection('practica', true)}
                    >
                      Ir a la práctica
                    </button>
                  ) : null}
                  {!isReadingEndEffective ? (
                    <button
                      type="button"
                      className="lp-ghost-action"
                      onClick={() => scrollToSection('resumen', true)}
                    >
                      Ir al resumen
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="lp-footer__nav">
              {prevLesson ? (
                <button
                  type="button"
                  className="lp-footer__nav-btn"
                  onClick={() =>
                    onOpenLesson ? onOpenLesson(prevLesson.id) : null
                  }
                >
                  <span className="lp-footer__nav-dir">← Lección anterior</span>
                  <strong className="lp-footer__nav-title">
                    {prevLesson.title}
                  </strong>
                </button>
              ) : (
                <button
                  type="button"
                  className="lp-footer__nav-btn"
                  onClick={() => (onNavigate ? onNavigate('roadmap') : null)}
                >
                  <span className="lp-footer__nav-dir">← Volver</span>
                  <strong className="lp-footer__nav-title">
                    Mapa curricular completo
                  </strong>
                </button>
              )}

              {nextLesson ? (
                <button
                  type="button"
                  className="lp-footer__nav-btn lp-footer__nav-btn--next"
                  onClick={() =>
                    onOpenLesson ? onOpenLesson(nextLesson.id) : null
                  }
                >
                  <span className="lp-footer__nav-dir">Siguiente lección →</span>
                  <strong className="lp-footer__nav-title">
                    {nextLesson.title}
                  </strong>
                </button>
              ) : (
                <button
                  type="button"
                  className="lp-footer__nav-btn lp-footer__nav-btn--next"
                  onClick={() => (onNavigate ? onNavigate('roadmap') : null)}
                >
                  <span className="lp-footer__nav-dir">Final de ruta →</span>
                  <strong className="lp-footer__nav-title">
                    Ver progreso en el mapa
                  </strong>
                </button>
              )}
            </div>
          </footer>
        </article>
      </div>

      {/* Paso 5 — Botón flotante "Preguntar" al seleccionar texto */}
      {selectionPopup ? (
        <div
          className="lp-selection-popover"
          style={{
            '--sel-x': `${selectionPopup.x}px`,
            '--sel-y': `${selectionPopup.y}px`,
          }}
        >
          <button
            type="button"
            className="lp-selection-ask-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const chosenText = selectionPopup.text;
              setSelectionPopup(null);
              triggerTutor({
                mode: 'free',
                sectionId: activeSectionId,
                selection: chosenText,
                prefill: `Explica este fragmento de la lección "${lesson.title}":\n\n"${chosenText}"`,
              });
            }}
          >
            Preguntar al tutor
          </button>
        </div>
      ) : null}

      {/* Drawer de Temario para móvil / pantallas donde no cabe inline */}
      <Sheet
        open={isMobileSyllabusOpen}
        onClose={() => setIsMobileSyllabusOpen(false)}
        side="left"
        title="Temario de la lección"
        description={lesson.title}
      >
        {renderSyllabusNav(() => setIsMobileSyllabusOpen(false))}
      </Sheet>

      {/* Paso 7 — Diálogo de atajos de teclado (?) */}
      <Dialog
        open={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        title="Atajos de teclado en la lección"
        description="Navega por las secciones, abre el tutor o responde comprobaciones sin levantar las manos del teclado."
        size="md"
      >
        <div className="lp-shortcuts-table-wrap">
          <table className="md-table lp-shortcuts-table">
            <thead>
              <tr>
                <th className="md-table__th">Tecla</th>
                <th className="md-table__th">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="md-table__td">
                  <Kbd>J</Kbd> / <Kbd>K</Kbd>
                </td>
                <td className="md-table__td">
                  Ir a la sección siguiente / anterior
                </td>
              </tr>
              <tr>
                <td className="md-table__td">
                  <Kbd>T</Kbd>
                </td>
                <td className="md-table__td">
                  Mostrar u ocultar el temario de la lección
                </td>
              </tr>
              <tr>
                <td className="md-table__td">
                  <Kbd>/</Kbd>
                </td>
                <td className="md-table__td">
                  Abrir el tutor contextualizado y enfocar el campo de pregunta
                </td>
              </tr>
              <tr>
                <td className="md-table__td">
                  <Kbd>1</Kbd> – <Kbd>4</Kbd>
                </td>
                <td className="md-table__td">
                  Seleccionar opción en la tarjeta de comprobación enfocada
                </td>
              </tr>
              <tr>
                <td className="md-table__td">
                  <Kbd>?</Kbd>
                </td>
                <td className="md-table__td">
                  Abrir o cerrar esta ventana de atajos
                </td>
              </tr>
              <tr>
                <td className="md-table__td">
                  <Kbd>Esc</Kbd>
                </td>
                <td className="md-table__td">
                  Cerrar popovers de glosario, selección o diálogos
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Dialog>
    </div>
  );
}

export default LessonPlayer;
