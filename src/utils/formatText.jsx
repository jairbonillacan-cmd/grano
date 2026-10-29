import React from 'react';

/**
 * Strips leading numeric prefixes like "1. ", "2) ", "1.1 " from section headings.
 */
export function stripSectionNumber(heading) {
  if (!heading || typeof heading !== 'string') return heading;
  return heading
    .replace(/^\s*(?:paso|secci[oó]n|parte)\s+\d+[\.\)\:\-–—]\s*/i, '')
    .replace(/^\s*\d+(?:\.\d+)*[\.\)\:\-–—]\s*/, '');
}

/**
 * Converts inline `code` backticks, **bold**, and *italic* markers into real React elements.
 */
export function formatInlineText(text) {
  if (!text) return '';
  if (typeof text !== 'string') {
    if (React.isValidElement(text)) return text;
    if (typeof text === 'object') {
      const extracted =
        text.description || text.title || text.criterion || text.label || text.text || '';
      return typeof extracted === 'string' ? formatInlineText(extracted) : '';
    }
    return String(text);
  }

  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code key={idx} className="lp-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return <strong key={idx}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={idx}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

/**
 * Renders section body text, automatically converting "1) ... 2) ... 3)" sequences
 * (whether on separate lines or inline inside a paragraph) into a semantic <ol> list,
 * and "- " / "• " bullet lines into a semantic <ul> list.
 */
export function renderProseBody(body) {
  if (!body || typeof body !== 'string') return null;

  const rawLines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks = [];
  let currentList = [];
  let currentUl = [];

  const flushList = (keyPrefix) => {
    if (currentList.length > 0) {
      blocks.push(
        <ol key={`ol-${keyPrefix}`}>
          {currentList.map((item, i) => (
            <li key={i}>{formatInlineText(item)}</li>
          ))}
        </ol>
      );
      currentList = [];
    }
    if (currentUl.length > 0) {
      blocks.push(
        <ul key={`ul-${keyPrefix}`}>
          {currentUl.map((item, i) => (
            <li key={i}>{formatInlineText(item)}</li>
          ))}
        </ul>
      );
      currentUl = [];
    }
  };

  rawLines.forEach((line, idx) => {
    // Case A: Line starts with "1) " or "1. "
    if (/^\d+[\)\.]\s+/.test(line)) {
      if (currentUl.length > 0) flushList(`ul-before-ol-${idx}`);
      const inlineParts = line
        .split(/(?:^|\s+|;\s*)\d+[\)\.]\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      inlineParts.forEach((part) => currentList.push(part));
      return;
    }

    // Case A2: Line starts with "- " or "• "
    if (/^[-•]\s+/.test(line)) {
      if (currentList.length > 0) flushList(`ol-before-ul-${idx}`);
      currentUl.push(line.replace(/^[-•]\s+/, '').trim());
      return;
    }

    // Case B: A paragraph has an intro sentence followed by inline "1) ... 2) ..."
    if (/(?:^|[\s:(])1\)\s+.+[\s;(]2\)\s+/.test(line)) {
      flushList(`pre-${idx}`);
      const firstMarkerIdx = line.search(/\b1\)\s+/);
      const intro = line.slice(0, firstMarkerIdx).trim();
      if (intro) {
        blocks.push(<p key={`p-intro-${idx}`}>{formatInlineText(intro)}</p>);
      }
      const listRemainder = line.slice(firstMarkerIdx);
      const items = listRemainder
        .split(/(?:^|\s+|;\s*)\d+\)\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      blocks.push(
        <ol key={`ol-inline-${idx}`}>
          {items.map((item, i) => (
            <li key={i}>{formatInlineText(item)}</li>
          ))}
        </ol>
      );
      return;
    }

    flushList(idx);
    blocks.push(<p key={`p-${idx}`}>{formatInlineText(line)}</p>);
  });

  flushList('end');
  return blocks;
}

/**
 * Splits a lesson goal string into 2 to 4 concise check items, ignoring commas/conjunctions
 * inside parentheses or backticks. Falls back to section headings if needed.
 */
export function splitGoalIntoChecks(goal, sections = []) {
  const normalizeItem = (str) => {
    const cleaned = String(str || '')
      .trim()
      .replace(/^[,;:\-–—•]+\s*/, '')
      .replace(/\.$/, '')
      .trim();
    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const rawParts = [];

  if (goal && typeof goal === 'string') {
    let buffer = '';
    let parenDepth = 0;
    let inBacktick = false;
    const text = goal.trim();

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '`') {
        inBacktick = !inBacktick;
        buffer += ch;
        continue;
      }
      if (!inBacktick) {
        if (ch === '(') parenDepth += 1;
        else if (ch === ')' && parenDepth > 0) parenDepth -= 1;
      }

      if (parenDepth === 0 && !inBacktick && (ch === ',' || ch === ';')) {
        const nextSlice = text.slice(i + 1).trim();
        if (/^y\s+/i.test(nextSlice)) {
          rawParts.push(buffer.trim());
          buffer = '';
          const yMatch = text.slice(i + 1).match(/^\s*y\s+/i);
          if (yMatch) i += yMatch[0].length;
          continue;
        }
        rawParts.push(buffer.trim());
        buffer = '';
        continue;
      }

      if (
        parenDepth === 0 &&
        !inBacktick &&
        buffer.trim().length >= 24 &&
        /^\s+y\s+(?:evitar|filtrar|decidir|diseñar|calcular|construir|aplicar|implementar|evaluar|comprender|entender|dominar|identificar|diagnosticar|elegir|configurar|conectar|prevenir|optimizar|garantizar|medir|auditar|combinar|comparar|reemplazar|ejecutar|modelar|desacoplar|gobernar|exponer|estructurar|validar|interpretar|detectar|resolver|usar|utilizar|manejar|c[oó]mo|el\s+patr[oó]n)\b/i.test(
          text.slice(i)
        )
      ) {
        rawParts.push(buffer.trim());
        buffer = '';
        const yMatch = text.slice(i).match(/^\s+y\s+/i);
        if (yMatch) {
          i += yMatch[0].length - 1;
        }
        continue;
      }

      buffer += ch;
    }

    if (buffer.trim()) {
      rawParts.push(buffer.trim());
    }
  }

  const items = rawParts.map(normalizeItem).filter((s) => s.length >= 8);

  if (items.length < 2 && Array.isArray(sections)) {
    sections.forEach((sec) => {
      if (items.length < 3 && sec?.heading) {
        const headingText = normalizeItem(stripSectionNumber(sec.heading));
        if (headingText && !items.includes(headingText)) {
          items.push(headingText);
        }
      }
    });
  }

  return items.slice(0, 4);
}

/**
 * Checks whether a table cell value looks numeric so it can be right-aligned.
 */
export function isNumericCell(val) {
  if (typeof val === 'number') return true;
  if (typeof val !== 'string') return false;
  return /^[\s$€+-]*\d+([.,]\d+)?(%|x|ms|s|MB|GB|KB|\s*USD)?$/i.test(val.trim());
}

/**
 * Renders the Markdown subset the AI tutor returns: fenced code blocks, #–### headings,
 * "-"/"*" and "1." lists, and paragraphs. Inline marks go through formatInlineText.
 * Never injects HTML.
 */
export function renderMarkdown(text) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) {
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

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      flushParagraph();
      flushList();
      const code = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'code', lang: fence[1] || '', text: code.join('\n') });
      continue;
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

  return blocks.map((block, idx) => {
    if (block.type === 'code') {
      return (
        <pre key={idx} className="md-code" data-lang={block.lang || undefined}>
          <code>{block.text}</code>
        </pre>
      );
    }
    if (block.type === 'h') {
      return (
        <p key={idx} className="md-heading">
          {formatInlineText(block.text)}
        </p>
      );
    }
    if (block.type === 'ul' || block.type === 'ol') {
      const ListTag = block.type;
      return (
        <ListTag key={idx} className="md-list">
          {block.items.map((item, j) => (
            <li key={j}>{formatInlineText(item)}</li>
          ))}
        </ListTag>
      );
    }
    return (
      <p key={idx} className="md-p">
        {formatInlineText(block.text)}
      </p>
    );
  });
}
