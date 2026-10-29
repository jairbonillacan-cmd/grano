import React, { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { buildCodeMirrorSchema } from './duckdb.js';

const granoHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--brand)', fontWeight: '600' },
  { tag: [tags.operatorKeyword, tags.modifier], color: 'var(--brand)' },
  { tag: [tags.function(tags.variableName), tags.standard(tags.name)], color: 'var(--track-de)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--ok)' },
  { tag: [tags.number, tags.integer, tags.float, tags.bool], color: 'var(--warn)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--ink-3)', fontStyle: 'italic' },
  { tag: [tags.typeName, tags.className], color: 'var(--track-de)' },
  { tag: [tags.propertyName, tags.variableName], color: 'var(--ink)' },
  { tag: [tags.punctuation, tags.bracket], color: 'var(--ink-2)' },
]);

const granoEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--code-bg)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-2)',
    lineHeight: 'var(--lh-reading)',
    borderRadius: 'var(--r-2)',
    border: '1px solid var(--line)',
  },
  '&.cm-focused': {
    outline: '2px solid var(--focus)',
    outlineOffset: '-1px',
    borderColor: 'var(--brand)',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: 'var(--lh-reading)',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: 'var(--sp-3) 0',
    caretColor: 'var(--brand)',
    minHeight: '8.5rem',
  },
  '.cm-line': {
    padding: '0 var(--sp-3)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--sunken)',
    color: 'var(--ink-3)',
    borderRight: '1px solid var(--line)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-1)',
    userSelect: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--brand-soft)',
    color: 'var(--ink)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(240, 122, 62, 0.08)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--brand-soft) !important',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--brand)',
    borderLeftWidth: '2px',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--line-control)',
    borderRadius: 'var(--r-1)',
    boxShadow: 'var(--shadow-pop)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-1)',
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--brand-soft)',
    color: 'var(--ink)',
  },
  '.cm-placeholder': {
    color: 'var(--ink-3)',
    fontStyle: 'italic',
  },
});

export function SqlEditor({
  value = '',
  onChange,
  onExecute,
  readOnly = false,
  placeholder = 'SELECT * FROM orders LIMIT 10;',
  minHeight = '9rem',
  ariaLabel = 'Editor de consultas SQL',
}) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onExecuteRef = useRef(onExecute);
  const readOnlyCompRef = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onExecuteRef.current = onExecute;
  }, [onExecute]);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const schemaMap = buildCodeMirrorSchema();
    const executeShortcut = keymap.of([
      {
        key: 'Mod-Enter',
        run: (view) => {
          if (onExecuteRef.current) {
            onExecuteRef.current(view.state.doc.toString());
          }
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        executeShortcut,
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        closeBrackets(),
        sql({
          dialect: PostgreSQL,
          schema: schemaMap,
          upperCaseKeywords: true,
          defaultTable: 'orders',
        }),
        autocompletion({
          activateOnTyping: true,
          maxRenderedOptions: 25,
        }),
        syntaxHighlighting(granoHighlightStyle),
        granoEditorTheme,
        EditorView.lineWrapping,
        EditorView.theme({
          '.cm-content': {
            minHeight,
          },
        }),
        EditorView.contentAttributes.of({
          'aria-label': ariaLabel,
          spellcheck: 'false',
          autocorrect: 'off',
          autocapitalize: 'off',
        }),
        cmPlaceholder(placeholder),
        readOnlyCompRef.current.of(EditorState.readOnly.of(Boolean(readOnly))),
        keymap.of([
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChangeRef.current) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only initialize editor once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value ?? '',
        },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompRef.current.reconfigure(EditorState.readOnly.of(Boolean(readOnly))),
    });
  }, [readOnly]);

  return <div ref={hostRef} className="sql-editor-host" data-testid="sql-editor" />;
}

export default SqlEditor;
