import React, { useState, useRef, useEffect } from 'react';
import { GLOSSARY_TERMS, GLOSSARY_BY_ID, GLOSSARY_CONCEPTS_2026 } from '../data/glossary.js';

const CONCEPT_BY_ID = Object.fromEntries(
  (GLOSSARY_CONCEPTS_2026 || []).map((item) => [item.id, item])
);

const CURATED_TERM_ALIASES = {
  'c01-grain-fanout': ['Fan-Out Trap', 'Fan-Out', 'fan-out', 'granularidad', 'grano'],
  'c02-cte-preagg': ['pre-agregación simétrica', 'pre-agregación', 'CTEs pre-agregadas', 'CTE'],
  'c03-window-qualify': ['funciones de ventana', 'Window Functions', 'QUALIFY'],
  'c04-asof-join': ['ASOF JOIN', 'LATERAL JOIN', 'cruce temporal'],
  'c05-window-frames': ['ROWS BETWEEN', 'RANGE BETWEEN', 'marcos de ventana'],
  'c06-star-vs-obt': ['Esquema en Estrella', 'Star Schema', 'One Big Table', 'OBT'],
  'c07-scd-type-2': ['SCD Tipo 2', 'SCD Type 2', 'Slowly Changing Dimensions'],
  'c08-point-in-time': ['Point-in-Time', 'Data Leakage', 'fuga de datos'],
  'c09-simpsons-paradox': ['Paradoja de Simpson', "Simpson's Paradox"],
  'c10-berksons-paradox': ['Sesgo de Berkson', 'sesgo de supervivencia', 'colisionador'],
  'c11-sargability': ['SARGability', 'SARGable', 'pushdown de predicados'],
  'c12-columnar-compression': ['almacenamiento columnar', 'Parquet', 'Zstandard', 'Run-Length Encoding'],
  'c13-zone-maps-bloom': ['Zone Maps', 'filtros Bloom', 'Bloom Filters', 'Data Skipping'],
  'c14-apache-arrow': ['Apache Arrow', 'Zero-Copy', 'ADBC'],
  'c15-polars-lazy': ['Polars', 'evaluación perezosa', 'LazyFrame'],
  'c16-duckdb-wasm-bi': ['DuckDB-Wasm', 'DuckDB', 'ejecución híbrida'],
  'c17-medallion-architecture': ['arquitectura Medallion', 'Medallion', 'Bronze', 'Silver', 'Gold'],
  'c18-iceberg-v3': ['Apache Iceberg', 'Iceberg', 'Deletion Vectors', 'Time Travel'],
  'c19-data-contracts-odcs': ['Contratos de Datos', 'Data Contracts', 'Esquema Fantasma'],
  'c20-sqlmesh-dbt-dag': ['SQLMesh', 'dbt Core', 'Entornos Virtuales de Datos'],
  'c21-semantic-layer': ['Capa Semántica', 'Semantic Layer', 'MetricFlow'],
  'c22-cohort-retention-ltv': ['cohortes de retención', 'retención por cohortes', 'LTV', 'NRR'],
  'c23-srm-ab-testing': ['Sample Ratio Mismatch', 'SRM'],
  'c24-cuped-variance': ['CUPED', 'reducción de varianza'],
  'c25-tufte-visual-perception': ['BI-as-Code', 'Small Multiples', 'Data-Ink Ratio'],
  'c26-bi-as-code': ['Change Data Capture', 'Debezium', 'Transactional Outbox', 'CDC'],
  'c27-cdc-flink-watermarks': ['Watermarks', 'Watermark', 'Event Time', 'Apache Flink'],
  'c28-mcp-semantic-rag-evals': ['Model Context Protocol', 'MCP', 'RAG Híbrido', 'Golden Evals'],
};

function buildGlossaryLookup(priorityTermIds = []) {
  const entries = [];
  const orderedIds = [
    ...priorityTermIds.filter((id) => GLOSSARY_BY_ID[id]),
    ...GLOSSARY_TERMS.map((t) => t.id).filter((id) => !priorityTermIds.includes(id)),
  ];

  for (const id of orderedIds) {
    const base = GLOSSARY_BY_ID[id];
    if (!base) continue;
    const legacy = CONCEPT_BY_ID[id];
    const definition = legacy?.plainDefinition || base.definition || '';
    const example = legacy?.syntaxExample || base.formula || '';
    const aliases = new Set([
      base.term,
      ...(CURATED_TERM_ALIASES[id] || []),
    ]);

    for (const rawAlias of aliases) {
      const alias = String(rawAlias || '').trim();
      if (alias.length >= 3) {
        entries.push({
          id,
          alias,
          aliasLower: alias.toLowerCase(),
          term: base.term,
          definition,
          example,
          track: base.track || 'core',
        });
      }
    }
  }

  entries.sort((a, b) => b.alias.length - a.alias.length);
  return entries;
}

/**
 * Popover interactivo para términos del glosario en línea.
 */
function GlossaryInlineTerm({ entry, matchedText }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setHovered(false);
        setPinned(false);
      }
    };
    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setHovered(false);
        setPinned(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  const firstExampleLines = entry.example
    ? entry.example.split('\n').slice(0, 4).join('\n')
    : '';

  return (
    <span
      ref={wrapRef}
      className={`lp-glossary-term-wrap${open ? ' is-open' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        role="button"
        tabIndex={0}
        className="lp-glossary-term"
        aria-expanded={open}
        aria-label={`${matchedText} — Término de glosario: ${entry.term}`}
        onClick={(e) => {
          e.stopPropagation();
          setPinned((prev) => !prev);
        }}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (wrapRef.current && !wrapRef.current.contains(e.relatedTarget)) {
            setHovered(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setPinned((prev) => !prev);
          } else if (e.key === 'Escape' && open) {
            e.preventDefault();
            setHovered(false);
            setPinned(false);
          }
        }}
      >
        {matchedText}
      </span>
      {open ? (
        <span role="tooltip" className="lp-glossary-popover">
          <span className="lp-glossary-popover__head">
            <strong className="lp-glossary-popover__title">{entry.term}</strong>
            <span className="lp-glossary-popover__badge">Glosario</span>
          </span>
          <span className="lp-glossary-popover__def">{entry.definition}</span>
          {firstExampleLines ? (
            <code className="lp-glossary-popover__code">{firstExampleLines}</code>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function isWordBoundaryChar(ch) {
  if (!ch) return true;
  return !/[\p{L}\p{N}_]/u.test(ch);
}

function annotateGlossaryTermsInSegment(text, keyPrefix, glossaryState) {
  if (!text || typeof text !== 'string' || !glossaryState || !glossaryState.entries?.length) {
    return text;
  }

  const lower = text.toLowerCase();
  const matches = [];

  for (const entry of glossaryState.entries) {
    if (glossaryState.seenIds.has(entry.id)) continue;
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(entry.aliasLower, searchFrom);
      if (idx === -1) break;
      const beforeChar = idx > 0 ? text[idx - 1] : '';
      const afterChar = idx + entry.alias.length < text.length ? text[idx + entry.alias.length] : '';
      const validBoundary = isWordBoundaryChar(beforeChar) && isWordBoundaryChar(afterChar);
      const overlaps = matches.some(
        (m) => idx < m.end && idx + entry.alias.length > m.start
      );
      if (validBoundary && !overlaps) {
        matches.push({
          start: idx,
          end: idx + entry.alias.length,
          entry,
          matchedText: text.slice(idx, idx + entry.alias.length),
        });
        glossaryState.seenIds.add(entry.id);
        break;
      }
      searchFrom = idx + 1;
    }
  }

  if (matches.length === 0) return text;
  matches.sort((a, b) => a.start - b.start);

  const nodes = [];
  let cursor = 0;
  matches.forEach((m, idx) => {
    if (m.start > cursor) {
      nodes.push(text.slice(cursor, m.start));
    }
    nodes.push(
      <GlossaryInlineTerm
        key={`${keyPrefix}-gt-${m.entry.id}-${idx}`}
        entry={m.entry}
        matchedText={m.matchedText}
      />
    );
    cursor = m.end;
  });
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return nodes;
}

function sanitizeHref(rawHref) {
  const href = String(rawHref || '').trim();
  if (
    href.startsWith('https://') ||
    href.startsWith('http://') ||
    href.startsWith('mailto:') ||
    href.startsWith('#') ||
    href.startsWith('/')
  ) {
    return href;
  }
  return '#';
}

/**
 * Elimina numeraciones redundantes al inicio de títulos de sección
 * como "1) ", "2. ", "Paso 1: ", etc.
 */
export function stripSectionNumber(title) {
  if (!title || typeof title !== 'string') return '';
  return title.replace(/^\s*(?:paso\s*)?\d+\s*[).:-]\s*/i, '').trim();
}

/**
 * Formatea texto inline convirtiendo:
 * - `código` en <code className="inline-code">
 * - [texto](url) en <a className="inline-link">
 * - **negrita** en <strong className="inline-strong">
 * - *cursiva* en <em className="inline-em">
 * - Primera aparición por sección de términos del glosario si options.glossaryState está activo.
 */
export function formatInlineText(text, keyPrefix = 'txt', options = {}) {
  if (!text || typeof text !== 'string') return text;

  const tokenRegex = /(`[^`\n]+`|\[[^\]]+\]\([^)\s]+\)|\*\*[^*\n]+\*\*|\*[^*\s][^*\n]*\*)/g;
  const parts = text.split(tokenRegex);

  if (parts.length === 1 && !options?.glossaryState) {
    return text;
  }

  const result = [];
  parts.forEach((part, index) => {
    if (!part) return;
    const itemKey = `${keyPrefix}-${index}`;

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      result.push(
        <code key={itemKey} className="inline-code">
          {part.slice(1, -1)}
        </code>
      );
      return;
    }

    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const splitIdx = part.indexOf('](');
      const label = part.slice(1, splitIdx);
      const rawUrl = part.slice(splitIdx + 2, -1);
      const safeUrl = sanitizeHref(rawUrl);
      const isExternal = safeUrl.startsWith('http://') || safeUrl.startsWith('https://');
      result.push(
        <a
          key={itemKey}
          href={safeUrl}
          className="inline-link"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {formatInlineText(label, `${itemKey}-lbl`)}
        </a>
      );
      return;
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2);
      result.push(
        <strong key={itemKey} className="inline-strong">
          {formatInlineText(inner, `${itemKey}-b`, options)}
        </strong>
      );
      return;
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const inner = part.slice(1, -1);
      result.push(
        <em key={itemKey} className="inline-em">
          {formatInlineText(inner, `${itemKey}-i`, options)}
        </em>
      );
      return;
    }

    if (options?.glossaryState) {
      const annotated = annotateGlossaryTermsInSegment(part, itemKey, options.glossaryState);
      if (Array.isArray(annotated)) {
        result.push(...annotated);
      } else {
        result.push(annotated);
      }
      return;
    }

    result.push(part);
  });

  return result;
}

/**
 * Detecta si un valor de celda de tabla es numérico, porcentaje o moneda
 * para alinearlo a la derecha con números tabulares.
 */
export function isNumericCell(val) {
  if (typeof val === 'number') return true;
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  return /^[+-]?[$€£]?\s*\d[\d.,\s]*[%xXkKmMbB]?$/.test(trimmed);
}

function splitMarkdownTableRow(line) {
  const trimmed = line.trim();
  const withoutOuterPipes = trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '');
  return withoutOuterPipes.split('|').map((cell) => cell.trim());
}

function isMarkdownTableSeparator(line) {
  if (!line || !line.includes('|')) return false;
  const cells = splitMarkdownTableRow(line);
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function parseTableAlignments(separatorLine, colCount) {
  const cells = splitMarkdownTableRow(separatorLine);
  return Array.from({ length: colCount }, (_, idx) => {
    const spec = cells[idx] || '';
    if (spec.startsWith(':') && spec.endsWith(':')) return 'center';
    if (spec.endsWith(':')) return 'right';
    return 'left';
  });
}

function renderMarkdownTableBlock(tableLines, keyPrefix, options) {
  if (tableLines.length < 2) return null;
  const headers = splitMarkdownTableRow(tableLines[0]);
  const hasSeparator = isMarkdownTableSeparator(tableLines[1]);
  const alignments = hasSeparator
    ? parseTableAlignments(tableLines[1], headers.length)
    : headers.map(() => 'left');
  const bodyLines = hasSeparator ? tableLines.slice(2) : tableLines.slice(1);
  const rows = bodyLines
    .filter((l) => l.trim().length > 0)
    .map((l) => splitMarkdownTableRow(l));

  return (
    <div key={keyPrefix} className="md-table-scroll" role="region" aria-label="Tabla de datos" tabIndex={0}>
      <table className="md-table">
        <thead>
          <tr>
            {headers.map((header, colIdx) => {
              const explicitRight = alignments[colIdx] === 'right';
              const autoNumericCol =
                rows.length > 0 &&
                rows.every((r) => !r[colIdx] || isNumericCell(r[colIdx]));
              const alignRight = explicitRight || autoNumericCol;
              return (
                <th
                  key={`${keyPrefix}-th-${colIdx}`}
                  className={`md-table__th${alignRight ? ' md-table__th--num tabular' : ''}`}
                >
                  {formatInlineText(header, `${keyPrefix}-th-txt-${colIdx}`, options)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={`${keyPrefix}-tr-${rowIdx}`}>
              {headers.map((_, colIdx) => {
                const cellVal = row[colIdx] ?? '';
                const alignRight =
                  alignments[colIdx] === 'right' || isNumericCell(cellVal);
                return (
                  <td
                    key={`${keyPrefix}-td-${rowIdx}-${colIdx}`}
                    className={`md-table__td${alignRight ? ' md-table__td--num tabular' : ''}`}
                  >
                    {formatInlineText(cellVal, `${keyPrefix}-td-txt-${rowIdx}-${colIdx}`, options)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renderiza Markdown estructurado:
 * párrafos, listas ul/ol, bloques de código ```sql/python, tablas | col | col |,
 * citas >, encabezados ### y términos de glosario opcionales.
 */
export function renderStructuredMarkdown(text, keyPrefix = 'md', options = {}) {
  if (!text || typeof text !== 'string') return null;

  const glossaryState = options.enableGlossary
    ? {
        entries: buildGlossaryLookup(options.glossaryTerms || []),
        seenIds: new Set(),
      }
    : null;
  const inlineOptions = glossaryState ? { glossaryState } : {};

  const segments = text.split(/(```[\s\S]*?```)/g);
  const elements = [];

  segments.forEach((segment, segIdx) => {
    if (!segment) return;

    if (segment.startsWith('```') && segment.endsWith('```')) {
      const lines = segment.slice(3, -3).trim().split('\n');
      const firstLine = (lines[0] || '').trim();
      const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
      const lang = hasLang ? firstLine.toUpperCase() : 'SQL';
      const codeContent = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

      elements.push(
        <div key={`${keyPrefix}-code-${segIdx}`} className="md-code-block">
          <div className="md-code-header">
            <span className="md-code-lang">{lang}</span>
          </div>
          <pre className="md-code-pre">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
      return;
    }

    const lines = segment.split('\n');
    let i = 0;

    while (i < lines.length) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        i += 1;
        continue;
      }

      // Tabla Markdown: línea con | seguida por separador |---| o al menos 2 pipes
      if (
        trimmed.includes('|') &&
        i + 1 < lines.length &&
        isMarkdownTableSeparator(lines[i + 1])
      ) {
        const tableLines = [trimmed, lines[i + 1].trim()];
        i += 2;
        while (i < lines.length && lines[i].trim().includes('|')) {
          tableLines.push(lines[i].trim());
          i += 1;
        }
        const tableEl = renderMarkdownTableBlock(
          tableLines,
          `${keyPrefix}-tbl-${segIdx}-${i}`,
          inlineOptions
        );
        if (tableEl) elements.push(tableEl);
        continue;
      }

      // Encabezados ### o ##
      if (/^#{2,4}\s+/.test(trimmed)) {
        const isH4 = trimmed.startsWith('#### ');
        const cleanHeading = trimmed.replace(/^#{2,4}\s+/, '');
        if (isH4) {
          elements.push(
            <h4 key={`${keyPrefix}-h4-${segIdx}-${i}`} className="md-h4">
              {formatInlineText(cleanHeading, `${keyPrefix}-h4t-${segIdx}-${i}`, inlineOptions)}
            </h4>
          );
        } else {
          elements.push(
            <h3 key={`${keyPrefix}-h3-${segIdx}-${i}`} className="md-h3">
              {formatInlineText(cleanHeading, `${keyPrefix}-h3t-${segIdx}-${i}`, inlineOptions)}
            </h3>
          );
        }
        i += 1;
        continue;
      }

      // Cita >
      if (trimmed.startsWith('>')) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i += 1;
        }
        elements.push(
          <blockquote key={`${keyPrefix}-q-${segIdx}-${i}`} className="md-blockquote">
            {formatInlineText(quoteLines.join(' '), `${keyPrefix}-qt-${segIdx}-${i}`, inlineOptions)}
          </blockquote>
        );
        continue;
      }

      // Lista desordenada
      if (/^[-*•]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
          i += 1;
        }
        elements.push(
          <ul key={`${keyPrefix}-ul-${segIdx}-${i}`} className="prose-list md-list">
            {items.map((item, idx) => (
              <li key={`${keyPrefix}-uli-${segIdx}-${i}-${idx}`}>
                {formatInlineText(item, `${keyPrefix}-ulit-${segIdx}-${i}-${idx}`, inlineOptions)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Lista ordenada
      if (/^\d+[.)]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
          i += 1;
        }
        elements.push(
          <ol key={`${keyPrefix}-ol-${segIdx}-${i}`} className="prose-list prose-list--ordered md-list md-list--ordered">
            {items.map((item, idx) => (
              <li key={`${keyPrefix}-oli-${segIdx}-${i}-${idx}`}>
                {formatInlineText(item, `${keyPrefix}-olit-${segIdx}-${i}-${idx}`, inlineOptions)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Párrafo normal (acumular líneas contiguas que no sean inicio de bloque especial)
      const paraLines = [trimmed];
      i += 1;
      while (i < lines.length) {
        const nextTrim = lines[i].trim();
        if (
          !nextTrim ||
          /^#{2,4}\s+/.test(nextTrim) ||
          nextTrim.startsWith('>') ||
          /^[-*•]\s+/.test(nextTrim) ||
          /^\d+[.)]\s+/.test(nextTrim) ||
          (nextTrim.includes('|') &&
            i + 1 < lines.length &&
            isMarkdownTableSeparator(lines[i + 1]))
        ) {
          break;
        }
        paraLines.push(nextTrim);
        i += 1;
      }

      const paragraphText = paraLines.join(' ');
      elements.push(
        <p key={`${keyPrefix}-p-${segIdx}-${i}`} className="prose-p md-p">
          {formatInlineText(paragraphText, `${keyPrefix}-pt-${segIdx}-${i}`, inlineOptions)}
        </p>
      );
    }
  });

  return elements;
}

/**
 * Renderiza el cuerpo de una sección educativa (prosa de lección).
 * Soporta todo el subconjunto Markdown + glosario en línea.
 */
export function renderProseBody(body, keyPrefix = 'prose', options = {}) {
  return renderStructuredMarkdown(body, keyPrefix, {
    enableGlossary: options.enableGlossary ?? true,
    glossaryTerms: options.glossaryTerms || [],
  });
}

/**
 * Divide el texto de un objetivo en criterios verificables limpios
 */
export function splitGoalIntoChecks(goal) {
  if (!goal || typeof goal !== 'string') return [];
  const rawParts = goal
    .split(/(?:\.\s+|;\s+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  if (rawParts.length <= 1) {
    return [goal.trim()];
  }

  return rawParts.map((part) => (part.endsWith('.') ? part : `${part}.`));
}

/**
 * Renderiza Markdown ligero para respuestas del Tutor IA y paneles secundarios.
 */
export function renderMarkdown(md, keyPrefix = 'md', options = {}) {
  return renderStructuredMarkdown(md, keyPrefix, {
    enableGlossary: options.enableGlossary ?? false,
    glossaryTerms: options.glossaryTerms || [],
  });
}
