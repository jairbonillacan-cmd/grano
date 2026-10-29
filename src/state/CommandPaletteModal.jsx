import React from 'react';
import { Button, Chip, Kbd } from '../components/ui/index.js';

export function CommandPaletteModal({
  isOpen = false,
  query = '',
  onChangeQuery = () => {},
  onClose = () => {},
  lessons = [],
  glossary = [],
  completedIds = [],
  onSelectLesson = () => {},
  onSelectGlossary = () => {},
}) {
  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Buscador de lecciones y glosario"
    >
      <div
        className="cmd-palette-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-palette-header">
          <input
            type="text"
            className="cmd-palette-input"
            placeholder="Buscar en las 18 lecciones o en el glosario técnico..."
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (lessons.length > 0) {
                  onSelectLesson(lessons[0].id);
                } else if (glossary.length > 0) {
                  onSelectGlossary(glossary[0]);
                }
              }
            }}
            autoFocus
            aria-label="Filtrar lecciones y términos del glosario"
          />
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Kbd>Esc</Kbd>
          </Button>
        </div>
        <div className="cmd-palette-list">
          {lessons.length > 0 && (
            <div>
              <div className="cmd-palette-section-label tabular">
                Lecciones ({lessons.length})
              </div>
              {lessons.map((lesson) => {
                const isDone = completedIds.includes(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className="cmd-palette-item"
                    onClick={() => onSelectLesson(lesson.id)}
                  >
                    <div>
                      <strong className="tabular">
                        {String(lesson.order).padStart(2, '0')}. {lesson.title}
                      </strong>
                      <div className="cmd-palette-item__sub">
                        {lesson.subtitle}
                      </div>
                    </div>
                    <Chip variant={isDone ? 'success' : 'neutral'}>
                      {isDone ? 'Completada' : lesson.duration}
                    </Chip>
                  </button>
                );
              })}
            </div>
          )}

          {glossary.length > 0 && (
            <div>
              <div className="cmd-palette-section-label tabular">
                Glosario ({glossary.length})
              </div>
              {glossary.map((concept) => (
                <button
                  key={concept.id}
                  type="button"
                  className="cmd-palette-item"
                  onClick={() => onSelectGlossary(concept)}
                >
                  <div>
                    <strong>{concept.term}</strong>
                    <div className="cmd-palette-item__sub">
                      Lección {concept.lessonNumber}: {concept.lessonTitle}
                    </div>
                  </div>
                  <Chip variant="neutral">
                    {concept.primaryRole || 'Glosario'}
                  </Chip>
                </button>
              ))}
            </div>
          )}

          {lessons.length === 0 && glossary.length === 0 && (
            <div className="cmd-palette-empty">
              No se encontraron lecciones ni términos para «{query}».
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPaletteModal;
