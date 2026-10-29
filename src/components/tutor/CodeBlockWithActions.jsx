import React, { useState } from 'react';
import { Check, Copy, FlaskConical } from 'lucide-react';
import { formatInlineText, isNumericCell } from '../../utils/formatText.jsx';

const SQL_START_RE =
  /^\s*(?:--[^\n]*\n\s*)*(?:SELECT|WITH|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|EXPLAIN|DESCRIBE|SHOW|PRAGMA|FROM)\b/i;

/**
 * Determina si un bloque de código corresponde a una consulta SQL ejecutable en el laboratorio.
 */
export function isSqlCodeBlock(lang = '', code = '') {
  const normalizedLang = String(lang || '').trim().toLowerCase();
  if (
    normalizedLang === 'sql' ||
    normalizedLang === 'duckdb' ||
    normalizedLang === 'postgres' ||
    normalizedLang === 'postgresql' ||
    normalizedLang === 'sqlite'
  ) {
    return true;
  }
  if (!normalizedLang && SQL_START_RE.test(String(code || ''))) {
    return true;
  }
  return false;
}

/**
 * Bloque de código del tutor con fondo `--code-bg`, botón "Copiar" y botón
 * "Abrir en el laboratorio" cuando el código es SQL.
 */
export function CodeBlockWithActions({
  code = '',
  lang = '',
  lessonId = null,
  onOpenInLab,
}) {
  const [copied, setCopied] = useState(false);
  const [sentToLab, setSentToLab] = useState(false);

  const isSql = isSqlCodeBlock(lang, code);
  const displayLang = isSql ? 'sql' : (lang || 'código').toLowerCase();

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else if (typeof document !== 'undefined') {
        const temp = document.createElement('textarea');
        temp.value = code;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignorar errores de portapapeles en entornos restringidos
    }
  };

  const handleOpenInLab = () => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem('grano_lab_sql', code);
        window.dispatchEvent(
          new CustomEvent('grano:open-in-lab', {
            detail: { code, lessonId },
          })
        );
      }
    } catch {
      // ignorar errores de sessionStorage
    }
    if (typeof onOpenInLab === 'function') {
      onOpenInLab(code, lessonId);
    }
    setSentToLab(true);
    setTimeout(() => setSentToLab(false), 2400);
  };

  return (
    <div className="tutor-code-block" data-lang={displayLang}>
      <div className="tutor-code-block__bar">
        <span className="tutor-code-block__lang tabular">{displayLang}</span>
        <div className="tutor-code-block__actions">
          <button
            type="button"
            className="tutor-code-block__btn"
            onClick={handleCopy}
            aria-label={copied ? 'Código copiado' : 'Copiar código'}
          >
            {copied ? (
              <>
                <Check size={13} aria-hidden="true" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy size={13} aria-hidden="true" />
                <span>Copiar</span>
              </>
            )}
          </button>

          {isSql && (
            <button
              type="button"
              className="tutor-code-block__btn tutor-code-block__btn--lab"
              onClick={handleOpenInLab}
              aria-label="Abrir consulta SQL en el laboratorio"
            >
              {sentToLab ? (
                <>
                  <Check size={13} aria-hidden="true" />
                  <span>En el laboratorio</span>
                </>
              ) : (
                <>
                  <FlaskConical size={13} aria-hidden="true" />
                  <span>Abrir en el laboratorio</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <pre className="tutor-code-block__pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseMarkdownTable(tableLines) {
  if (!Array.isArray(tableLines) || tableLines.length < 2) return null;
  const parseRow = (row) =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const headers = parseRow(tableLines[0]);
  const separator = tableLines[1].trim();
  if (!/^[\|\s:\-]+$/.test(separator)) return null;

  const rows = tableLines.slice(2).map(parseRow);
  return { headers, rows };
}

/**
 * Renderiza el subconjunto de Markdown del tutor (párrafos, listas, encabezados, tablas,
 * código inline y bloques de código con acciones "Copiar" y "Abrir en el laboratorio").
 * Nunca inyecta HTML crudo.
 */
export function renderTutorMarkdown(
  text,
  { lessonId = null, onOpenInLab, isStreaming = false } = {}
) {
  if (!text || typeof text !== 'string') {
    if (isStreaming) {
      return <span className="tutor-stream-cursor" aria-hidden="true" />;
    }
    return null;
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;
  let tableLines = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  const flushTable = () => {
    if (tableLines.length > 0) {
      const parsedTable = parseMarkdownTable(tableLines);
      if (parsedTable) {
        blocks.push({ type: 'table', ...parsedTable });
      } else {
        blocks.push({ type: 'p', text: tableLines.join(' ') });
      }
      tableLines = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      flushParagraph();
      flushList();
      flushTable();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({
        type: 'code',
        lang: fence[1] || '',
        text: codeLines.join('\n'),
      });
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushParagraph();
      flushList();
      tableLines.push(line);
      continue;
    } else if (tableLines.length > 0) {
      flushTable();
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h', text: heading[2] });
      continue;
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      const type = numbered ? 'ol' : 'ul';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((numbered || bullet)[1]);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushTable();

  return blocks.map((block, idx) => {
    const isLast = idx === blocks.length - 1;
    const cursorEl =
      isStreaming && isLast ? (
        <span className="tutor-stream-cursor" aria-hidden="true" />
      ) : null;

    if (block.type === 'code') {
      return (
        <React.Fragment key={idx}>
          <CodeBlockWithActions
            code={block.text}
            lang={block.lang}
            lessonId={lessonId}
            onOpenInLab={onOpenInLab}
          />
          {cursorEl}
        </React.Fragment>
      );
    }

    if (block.type === 'table') {
      return (
        <div key={idx} className="tutor-md-table-wrap">
          <table className="tutor-md-table">
            <thead>
              <tr>
                {block.headers.map((h, hIdx) => (
                  <th key={hIdx}>{formatInlineText(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={isNumericCell(cell) ? 'is-num tabular' : undefined}
                    >
                      {formatInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {cursorEl}
        </div>
      );
    }

    if (block.type === 'h') {
      return (
        <p key={idx} className="md-heading">
          {formatInlineText(block.text)}
          {cursorEl}
        </p>
      );
    }

    if (block.type === 'ul' || block.type === 'ol') {
      const ListTag = block.type;
      return (
        <ListTag key={idx} className="md-list">
          {block.items.map((item, j) => {
            const isLastItem = isLast && j === block.items.length - 1;
            return (
              <li key={j}>
                {formatInlineText(item)}
                {isStreaming && isLastItem ? (
                  <span className="tutor-stream-cursor" aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ListTag>
      );
    }

    return (
      <p key={idx} className="md-p">
        {formatInlineText(block.text)}
        {cursorEl}
      </p>
    );
  });
}

export default CodeBlockWithActions;
