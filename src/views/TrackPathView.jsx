import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { TRACKS } from '../data/catalog/tracks.js';
import { LEVELS } from '../data/catalog/levels.js';
import { MODULES, getTrackPath } from '../data/catalog/modules.js';

// Ruta por área: tronco común + el área elegida, agrupada por nivel.
// Las lecciones que ya existen se abren; las planificadas se muestran como "En preparación".
const TRACK_KEY = 'grano_track';
const CHOICES = [
  ...TRACKS.filter((t) => t.id !== 'core'),
  { id: 'all', name: 'Todo', short: 'Todo', summary: 'El tronco común y las tres áreas juntas.', dayToDay: [] },
];

function readTrack() {
  try {
    const saved = window.localStorage.getItem(TRACK_KEY);
    if (CHOICES.some((c) => c.id === saved)) return saved;
  } catch {
    // ignore storage errors
  }
  return null;
}

export function TrackPathView({ completedIds = [], onOpenLesson = () => {} }) {
  const [track, setTrack] = useState(readTrack);
  const [openModules, setOpenModules] = useState(() => new Set());

  useEffect(() => {
    if (!track) return;
    try {
      window.localStorage.setItem(TRACK_KEY, track);
    } catch {
      // ignore storage errors
    }
  }, [track]);

  const modules = useMemo(() => {
    if (!track) return [];
    return track === 'all'
      ? [...MODULES].sort((a, b) => a.level - b.level || MODULES.indexOf(a) - MODULES.indexOf(b))
      : getTrackPath(track);
  }, [track]);

  const completed = useMemo(() => new Set(completedIds), [completedIds]);
  const lessons = modules.flatMap((m) => m.lessons);
  const available = lessons.filter((l) => l.status === 'existing');
  const done = available.filter((l) => completed.has(l.legacyId));
  const choice = CHOICES.find((c) => c.id === track);

  const toggleModule = (id) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="track-path" aria-labelledby="track-path-title">
      <header className="track-path__head">
        <div>
          <h2 id="track-path-title" className="track-path__title">
            Ruta por área
          </h2>
          <p className="track-path__lead">
            {track
              ? 'Tronco común primero, luego tu área. Puedes cambiarla cuando quieras.'
              : '¿Qué quieres hacer con datos? Elige un área para ver tu ruta de cero a experto.'}
          </p>
        </div>
        <div className="track-path__switch" role="radiogroup" aria-label="Área">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={track === c.id}
              className={`track-path__option ${track === c.id ? 'is-active' : ''}`.trim()}
              data-track={c.id}
              onClick={() => setTrack(c.id)}
            >
              <span className="track-path__dot" aria-hidden="true" />
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {!track && (
        <div className="track-path__choices">
          {CHOICES.filter((c) => c.id !== 'all').map((c) => (
            <button
              key={c.id}
              type="button"
              className="track-path__choice"
              data-track={c.id}
              onClick={() => setTrack(c.id)}
            >
              <span className="track-path__choice-name">
                <span className="track-path__dot" aria-hidden="true" />
                {c.name}
              </span>
              <span className="track-path__choice-summary">{c.summary}</span>
              <ul className="track-path__choice-list">
                {c.dayToDay.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      )}

      {track && (
        <>
          <div className="track-path__summary">
            <p className="track-path__summary-text">{choice?.summary}</p>
            <p className="track-path__stats tabular">
              {modules.length} módulos · {lessons.length} lecciones · {available.length} disponibles ·{' '}
              {done.length} terminadas
            </p>
            <div
              className="track-path__bar"
              role="progressbar"
              aria-label="Lecciones terminadas de esta ruta"
              aria-valuemin={0}
              aria-valuemax={lessons.length}
              aria-valuenow={done.length}
            >
              <span style={{ '--value': `${lessons.length ? (done.length / lessons.length) * 100 : 0}%` }} />
            </div>
          </div>

          {LEVELS.map((level) => {
            const levelModules = modules.filter((m) => m.level === level.id);
            if (!levelModules.length) return null;
            return (
              <div key={level.id} className="track-path__level">
                <div className="track-path__level-head">
                  <span className="track-path__level-num tabular">N{level.id}</span>
                  <h3 className="track-path__level-name">{level.name}</h3>
                  <p className="track-path__level-outcome">{level.outcome}</p>
                </div>

                <ol className="track-path__modules">
                  {levelModules.map((m) => {
                    const isOpen = openModules.has(m.id);
                    const ready = m.lessons.filter((l) => l.status === 'existing');
                    const moduleDone = ready.filter((l) => completed.has(l.legacyId)).length;
                    return (
                      <li key={m.id} className="track-path__module" data-track={m.track}>
                        <button
                          type="button"
                          className="track-path__module-row"
                          aria-expanded={isOpen}
                          onClick={() => toggleModule(m.id)}
                        >
                          <span className="track-path__dot" aria-hidden="true" />
                          <span className="track-path__module-main">
                            <span className="track-path__module-title">{m.title}</span>
                            <span className="track-path__module-goal">{m.goal}</span>
                          </span>
                          <span className="track-path__module-meta tabular">
                            {ready.length ? `${moduleDone}/${ready.length} · ` : ''}
                            {m.lessons.length} lecciones
                          </span>
                          <ChevronDown size={16} aria-hidden="true" className="track-path__chevron" />
                        </button>

                        {isOpen && (
                          <div className="track-path__module-body">
                            <ol className="track-path__lessons">
                              {m.lessons.map((l) => {
                                const isDone = l.legacyId && completed.has(l.legacyId);
                                return (
                                  <li key={`${m.id}-${l.id}`}>
                                    {l.status === 'existing' ? (
                                      <button
                                        type="button"
                                        className="track-path__lesson"
                                        onClick={() => onOpenLesson(l.legacyId)}
                                      >
                                        <span className="track-path__lesson-state" aria-hidden="true">
                                          {isDone ? <Check size={14} /> : l.order}
                                        </span>
                                        <span>{l.title}</span>
                                        {isDone && <span className="sr-only">(terminada)</span>}
                                      </button>
                                    ) : (
                                      <span className="track-path__lesson is-planned">
                                        <span className="track-path__lesson-state" aria-hidden="true">
                                          {l.order}
                                        </span>
                                        <span>{l.title}</span>
                                        <span className="track-path__soon">
                                          <Clock size={12} aria-hidden="true" /> En preparación
                                        </span>
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ol>
                            <p className="track-path__project">
                              <strong>Proyecto del módulo:</strong> {m.project}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

export default TrackPathView;
