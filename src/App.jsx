import React, { Suspense, lazy } from 'react';
import { LEARNING_STAGES, LESSONS } from './data/learningPath2026.js';
import AppShell from './layout/AppShell.jsx';
import HomeView from './views/HomeView.jsx';
import RoadmapView from './views/RoadmapView.jsx';
import LessonPlayer from './views/LessonPlayer.jsx';
import Onboarding from './views/Onboarding.jsx';
import SettingsView from './views/SettingsView.jsx';
import TutorPanel from './components/TutorPanel.jsx';
import DiagnosticModal from './components/DiagnosticModal.jsx';
import SpacedRepetitionView from './components/SpacedRepetitionView.jsx';
import CapstoneProjectsView from './components/CapstoneProjectsView.jsx';
import GlossaryAndGraphView from './components/GlossaryAndGraphView.jsx';
import LearningAnalyticsView from './components/LearningAnalyticsView.jsx';
import { UiShowcase } from './components/ui/index.js';
import { CommandPaletteModal } from './state/CommandPaletteModal.jsx';
import { useAppController } from './state/useAppController.js';

const PracticeView = lazy(() => import('./views/PracticeView.jsx'));

export default function App() {
  const {
    isUiShowcase,
    theme,
    setTheme,
    toggleTheme,
    viewMode,
    handleNavigate,
    activeLessonId,
    currentLesson,
    currentStage,
    prevLesson,
    nextLesson,
    nextRecommendedLesson,
    lessonSteps,
    completedIds,
    quizAnswers,
    completedLabIds,
    completedPipelineIds,
    completedCapstoneIds,
    diagnosticResult,
    leitnerState,
    dueCardsCount,
    diagnosticOpen,
    setDiagnosticOpen,
    tutorOpen,
    onToggleTutor,
    onOpenTutor,
    onCloseTutor,
    engineMode,
    setEngineMode,
    aiLoading,
    aiInput,
    setAiInput,
    aiMessages,
    askTutor,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandQuery,
    setCommandQuery,
    filteredCommandLessons,
    filteredCommandGlossary,
    activeStepLabel,
    openLesson,
    handleStepChange,
    toggleCompleteLesson,
    handleSelectQuizOption,
    handleSolveLab,
    handleSolvePipeline,
    toggleCompleteCapstone,
    handleReviewCard,
    handleResetDeck,
    handleCompleteDiagnostic,
  } = useAppController();

  if (isUiShowcase) {
    return <UiShowcase theme={theme} onThemeChange={setTheme} />;
  }

  return (
    <AppShell
      viewMode={viewMode}
      onNavigate={handleNavigate}
      completedIds={completedIds}
      totalLessons={LESSONS.length}
      dueCardsCount={dueCardsCount}
      tutorOpen={tutorOpen}
      onToggleTutor={onToggleTutor}
      theme={theme}
      onToggleTheme={toggleTheme}
      onThemeChange={setTheme}
      onOpenCommandPalette={() => {
        setCommandQuery('');
        setCommandPaletteOpen(true);
      }}
      tutorPanel={
        <TutorPanel
          currentLesson={currentLesson}
          currentStage={currentStage}
          activeStepLabel={viewMode === 'lesson' ? activeStepLabel : undefined}
          engineMode={engineMode}
          onChangeEngineMode={setEngineMode}
          aiLoading={aiLoading}
          aiInput={aiInput}
          onChangeAiInput={setAiInput}
          aiMessages={aiMessages}
          onAskTutor={askTutor}
          onClose={onCloseTutor}
        />
      }
    >
      <DiagnosticModal
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        onCompleteDiagnostic={handleCompleteDiagnostic}
      />

      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        query={commandQuery}
        onChangeQuery={setCommandQuery}
        onClose={() => setCommandPaletteOpen(false)}
        lessons={filteredCommandLessons}
        glossary={filteredCommandGlossary}
        completedIds={completedIds}
        onSelectLesson={openLesson}
        onSelectGlossary={() => {
          handleNavigate('glossary');
          setCommandPaletteOpen(false);
        }}
      />

      {viewMode === 'onboarding' && (
        <Onboarding
          onComplete={() => handleNavigate('home')}
          onSkip={() => handleNavigate('home')}
        />
      )}

      {viewMode === 'home' && (
        <HomeView
          stages={LEARNING_STAGES}
          lessons={LESSONS}
          activeLessonId={activeLessonId}
          nextRecommendedLesson={nextRecommendedLesson}
          lessonSteps={lessonSteps}
          completedIds={completedIds}
          quizAnswers={quizAnswers}
          completedLabIds={completedLabIds}
          completedPipelineIds={completedPipelineIds}
          diagnosticResult={diagnosticResult}
          leitnerState={leitnerState}
          onOpenLesson={openLesson}
          onNavigate={handleNavigate}
          onOpenDiagnostic={() => setDiagnosticOpen(true)}
        />
      )}

      {viewMode === 'roadmap' && (
        <RoadmapView
          stages={LEARNING_STAGES}
          lessons={LESSONS}
          completedIds={completedIds}
          lessonSteps={lessonSteps}
          completedLabIds={completedLabIds}
          diagnosticResult={diagnosticResult}
          nextRecommendedLesson={nextRecommendedLesson}
          onOpenLesson={openLesson}
          onOpenDiagnostic={() => setDiagnosticOpen(true)}
        />
      )}

      {viewMode === 'lesson' && (
        <LessonPlayer
          lessons={LESSONS}
          currentLesson={currentLesson}
          currentStage={currentStage}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          currentStep={lessonSteps[currentLesson.id] ?? 0}
          onStepChange={handleStepChange}
          completedIds={completedIds}
          quizAnswers={quizAnswers}
          completedLabIds={completedLabIds}
          completedPipelineIds={completedPipelineIds}
          onSelectQuizOption={handleSelectQuizOption}
          onToggleCompleteLesson={toggleCompleteLesson}
          onSolveLab={handleSolveLab}
          onSolvePipeline={handleSolvePipeline}
          onOpenLesson={openLesson}
          onNavigate={handleNavigate}
          onAskTutor={askTutor}
          onOpenTutor={onOpenTutor}
        />
      )}

      {viewMode === 'practice' && (
        <Suspense fallback={<div className="practice-loading">Cargando laboratorio SQL…</div>}>
          <PracticeView initialLessonId={activeLessonId} onSelectLesson={openLesson} />
        </Suspense>
      )}

      {viewMode === 'review' && (
        <SpacedRepetitionView
          leitnerState={leitnerState}
          completedIds={completedIds}
          lessonSteps={lessonSteps}
          onReviewCard={handleReviewCard}
          onResetDeck={handleResetDeck}
          onOpenLesson={openLesson}
        />
      )}

      {viewMode === 'capstones' && (
        <CapstoneProjectsView
          completedIds={completedIds}
          completedCapstoneIds={completedCapstoneIds}
          onToggleCompleteCapstone={toggleCompleteCapstone}
          onAskAiTutor={(prompt) => {
            handleNavigate('lesson');
            askTutor(prompt);
          }}
        />
      )}

      {viewMode === 'glossary' && (
        <GlossaryAndGraphView onOpenLesson={openLesson} />
      )}

      {viewMode === 'analytics' && (
        <LearningAnalyticsView
          lessons={LESSONS}
          completedIds={completedIds}
          quizScores={quizAnswers}
          codeSolvedIds={completedLabIds}
          leitnerStats={leitnerState}
          diagnosticResult={diagnosticResult}
          onOpenLesson={openLesson}
          onOpenDiagnostic={() => setDiagnosticOpen(true)}
        />
      )}

      {viewMode === 'settings' && (
        <SettingsView onNavigate={handleNavigate} onBack={() => handleNavigate('home')} />
      )}
    </AppShell>
  );
}
