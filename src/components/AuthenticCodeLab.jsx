import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { CheckCircle2, RotateCcw, Lightbulb, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { LESSONS_V2, getLessonById } from '../data/lessons/index.js';
import { openTutor, solvePractice } from '../state/store.js';
import '../styles/views/lab.css';

const LazySqlLab = lazy(() => import('../lab/SqlLab.jsx'));
const LazyPracticeView = lazy(() => import('../views/PracticeView.jsx'));

export function AuthenticCodeLab({
  lessonId = null,
  practice = null,
  challenge = null,
  onSolve,
  onAskAiTutor,
  embeddedInPracticeView = false,
}) {
  const forceFullPracticeView =
    !embeddedInPracticeView &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('t10_view') === 'practice';
  const matchedLesson = useMemo(() => {
    if (lessonId) {
      return getLessonById(lessonId) || LESSONS_V2.find((l) => l.id === lessonId) || null;
    }
    const target = practice || challenge;
    if (target) {
      const byContent = LESSONS_V2.find(
        (l) =>
          (target.prompt && l.practice?.prompt === target.prompt) ||
          (target.instruction && l.practice?.prompt === target.instruction) ||
          (target.starterCode && l.practice?.starterCode === target.starterCode) ||
          (target.templateCode && l.practice?.starterCode === target.templateCode) ||
          target.title === `Práctica: ${l.title}`
      );
      if (byContent) return byContent;
    }
    if (typeof window !== 'undefined') {
      try {
        const rawStoredId = window.localStorage.getItem('manual_datos_current_lesson_v1');
        const parsedId = rawStoredId ? JSON.parse(rawStoredId) : null;
        if (parsedId) {
          const byStored = getLessonById(parsedId);
          if (byStored) return byStored;
        }
      } catch {
        // ignore storage parse error
      }
    }
    return LESSONS_V2[0] || null;
  }, [lessonId, practice, challenge]);

  const resolvedLessonId = lessonId || matchedLesson?.v2Id || matchedLesson?.id || null;
  const resolvedPractice = useMemo(() => {
    if (practice && practice.type) return practice;
    if (challenge && challenge.type) return challenge;
    if (matchedLesson?.practice) return matchedLesson.practice;
    if (!challenge) return null;
    return {
      type: 'fill-blanks',
      title: challenge.title || 'Práctica guiada',
      prompt: challenge.prompt || challenge.instruction || challenge.description || '',
      starterCode: challenge.starterCode || challenge.templateCode || challenge.template || '',
      blanks: Array.isArray(challenge.blanks) ? challenge.blanks : [],
      hints: Array.isArray(challenge.hints) ? challenge.hints : [],
      solution: challenge.solution || '',
      solutionExplanation: challenge.solutionExplanation || '',
    };
  }, [practice, challenge, matchedLesson]);

  const isSqlPractice = resolvedPractice?.type === 'sql';

  // State for fill-blanks mode
  const blanks = useMemo(() => {
    const raw = resolvedPractice?.blanks || challenge?.blanks || [];
    return Array.isArray(raw) ? raw : [];
  }, [resolvedPractice, challenge]);

  const templateText =
    resolvedPractice?.starterCode ||
    challenge?.templateCode ||
    challenge?.template ||
    '';

  const [selectedValues, setSelectedValues] = useState({});
  const [activeBlankId, setActiveBlankId] = useState(() => blanks[0]?.id || null);
  const [checkedStatus, setCheckedStatus] = useState(null); // null | 'passed' | 'failed'
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    setSelectedValues({});
    setActiveBlankId(blanks[0]?.id || null);
    setCheckedStatus(null);
    setRevealedHints(0);
    setShowSolution(false);
  }, [resolvedLessonId, templateText, blanks]);

  if (forceFullPracticeView) {
    return (
      <Suspense
        fallback={
          <div className="sql-lab" data-testid="sql-lab-loading">
            <span className="sql-lab-engine-pill is-loading">Preparando el motor SQL…</span>
          </div>
        }
      >
        <LazyPracticeView initialLessonId={resolvedLessonId} />
      </Suspense>
    );
  }

  if (!resolvedPractice) return null;

  if (isSqlPractice) {
    return (
      <Suspense
        fallback={
          <div className="sql-lab" data-testid="sql-lab-loading">
            <span className="sql-lab-engine-pill is-loading">Preparando el motor SQL…</span>
          </div>
        }
      >
        <LazySqlLab
          lessonId={resolvedLessonId}
          title={
            challenge?.title ||
            resolvedPractice.title ||
            (matchedLesson ? `Práctica: ${matchedLesson.title}` : 'Práctica SQL')
          }
          prompt={resolvedPractice.prompt}
          starterCode={resolvedPractice.starterCode}
          practice={resolvedPractice}
          mode="practice"
          onSolve={onSolve}
        />
      </Suspense>
    );
  }

  const activeBlank = blanks.find((b) => b.id === activeBlankId) || blanks[0] || null;
  const hints = Array.isArray(resolvedPractice.hints) ? resolvedPractice.hints : [];

  const handleSelectToken = (blankId, optionValue) => {
    const next = { ...selectedValues, [blankId]: optionValue };
    setSelectedValues(next);
    setCheckedStatus(null);
    const nextUnfilled = blanks.find((b) => b.id !== blankId && !next[b.id]);
    if (nextUnfilled) {
      setActiveBlankId(nextUnfilled.id);
    }
  };

  const handleVerifyBlanks = () => {
    if (blanks.length === 0) return;
    const allCorrect = blanks.every((b) => selectedValues[b.id] === b.correct);
    setCheckedStatus(allCorrect ? 'passed' : 'failed');
    if (allCorrect) {
      if (resolvedLessonId) {
        solvePractice(resolvedLessonId, {
          passed: true,
          mode: 'fill-blanks',
          answers: selectedValues,
        });
      }
      if (onSolve) {
        onSolve();
      }
    }
  };

  const handleResetBlanks = () => {
    setSelectedValues({});
    setActiveBlankId(blanks[0]?.id || null);
    setCheckedStatus(null);
  };

  const handleReviewWithTutor = () => {
    if (onAskAiTutor) {
      onAskAiTutor({
        mode: 'review-sql',
        lessonId: resolvedLessonId,
        code: templateText,
        result: selectedValues,
      });
      return;
    }
    openTutor({
      mode: 'review-sql',
      lessonId: resolvedLessonId,
      code: templateText,
      result: selectedValues,
    });
  };

  const renderTemplateSegments = () => {
    const parts = String(templateText).split(/(\{\{blank_\d+\}\})/g);
    return parts.map((segment, idx) => {
      const match = segment.match(/^\{\{(blank_\d+)\}\}$/);
      if (!match) {
        return <span key={idx}>{segment}</span>;
      }
      const blankId = match[1];
      const blankSpec = blanks.find((b) => b.id === blankId);
      const val = selectedValues[blankId];
      const isAct = activeBlankId === blankId;
      let statusClass = '';
      if (checkedStatus && blankSpec) {
        statusClass = val === blankSpec.correct ? 'is-correct' : 'is-wrong';
      } else if (val) {
        statusClass = 'is-filled';
      }

      return (
        <button
          key={idx}
          type="button"
          className={`code-blank-slot ${isAct ? 'is-active' : ''} ${statusClass}`}
          onClick={() => setActiveBlankId(blankId)}
          data-testid={`blank-slot-${blankId}`}
        >
          {val || `[${blankId.replace('blank_', 'hueco ')}]`}
        </button>
      );
    });
  };

  return (
    <section className="code-challenge-card" data-testid="fill-blanks-lab">
      <header className="sql-lab-header">
        <div className="sql-lab-title-group">
          <span className="sql-lab-kicker">Práctica de código estructurado</span>
          <h3 className="sql-lab-title">
            {challenge?.title ||
              resolvedPractice.title ||
              (matchedLesson ? `Práctica: ${matchedLesson.title}` : 'Completar bloques clave')}
          </h3>
          {resolvedPractice.prompt && (
            <p className="sql-lab-prompt">{resolvedPractice.prompt}</p>
          )}
        </div>
      </header>

      <pre className="code-template-box">
        <code>{renderTemplateSegments()}</code>
      </pre>

      {activeBlank && (
        <div className="code-token-bank" data-testid="blank-token-bank">
          <span className="code-token-bank__label">
            Opciones para {activeBlank.id.replace('blank_', 'hueco ')}:
          </span>
          {(activeBlank.options || []).map((opt) => (
            <button
              key={opt}
              type="button"
              className="code-token-chip"
              onClick={() => handleSelectToken(activeBlank.id, opt)}
              data-testid={`token-option-${opt}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="sql-lab-toolbar">
        <div className="sql-lab-actions-left">
          <button
            type="button"
            className="sql-btn sql-btn-primary"
            onClick={handleVerifyBlanks}
            data-testid="verify-blanks-btn"
          >
            <CheckCircle2 size={14} />
            <span>Comprobar respuesta</span>
          </button>

          <button
            type="button"
            className="sql-btn sql-btn-ghost"
            onClick={handleResetBlanks}
          >
            <RotateCcw size={14} />
            <span>Reiniciar huecos</span>
          </button>
        </div>

        <div className="sql-lab-actions-right">
          {hints.length > 0 && revealedHints < hints.length && (
            <button
              type="button"
              className="sql-btn sql-btn-ghost"
              onClick={() => setRevealedHints((n) => Math.min(hints.length, n + 1))}
            >
              <Lightbulb size={14} />
              <span>Ver pista ({revealedHints}/{hints.length})</span>
            </button>
          )}

          {resolvedPractice.solution && (
            <button
              type="button"
              className="sql-btn sql-btn-ghost"
              onClick={() => setShowSolution((v) => !v)}
            >
              {showSolution ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showSolution ? 'Ocultar solución' : 'Ver solución'}</span>
            </button>
          )}

          <button
            type="button"
            className="sql-btn sql-btn-secondary"
            onClick={handleReviewWithTutor}
          >
            <MessageSquare size={14} />
            <span>Consultar al tutor</span>
          </button>
        </div>
      </div>

      {revealedHints > 0 && (
        <div className="sql-hints-box">
          {hints.slice(0, revealedHints).map((h, i) => (
            <p key={i} className="sql-hint-item">
              <strong>Pista {i + 1}:</strong> {h}
            </p>
          ))}
        </div>
      )}

      {checkedStatus && (
        <div
          className={`sql-grade-box ${checkedStatus === 'passed' ? 'is-pass' : 'is-fail'}`}
          data-testid="fill-blanks-feedback"
        >
          <span className="sql-grade-title">
            {checkedStatus === 'passed'
              ? 'Respuesta verificada · Todos los bloques coinciden con la especificación'
              : 'Algunos huecos no coinciden · Revisa los bloques marcados en rojo'}
          </span>
          {checkedStatus === 'passed' && resolvedPractice.solutionExplanation && (
            <p className="sql-grade-summary">{resolvedPractice.solutionExplanation}</p>
          )}
        </div>
      )}

      {showSolution && resolvedPractice.solution && (
        <div className="sql-solution-box">
          <span className="sql-grade-title">Solución de referencia</span>
          <pre className="sql-solution-pre">
            <code>{resolvedPractice.solution}</code>
          </pre>
          {resolvedPractice.solutionExplanation && (
            <p className="sql-solution-explanation">{resolvedPractice.solutionExplanation}</p>
          )}
        </div>
      )}
    </section>
  );
}

export default AuthenticCodeLab;
