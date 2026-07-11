/**
 * markdownToTipTap.ts
 * Converts GFM Markdown directly into TipTap-compatible JSON content nodes.
 * Using JSON nodes (not HTML strings) is the most reliable way to insert
 * formatted, editable content into TipTap.
 */

// ─── Inline mark parsing ────────────────────────────────────────────────────

interface TextNode {
  type: 'text';
  text: string;
  marks?: { type: string; attrs?: Record<string, string> }[];
}

/** Parse an inline markdown span into an array of TipTap text nodes with marks */
function parseInline(text: string): TextNode[] {
  const nodes: TextNode[] = [];

  // Split on bold+italic, bold, italic, code, strikethrough, links
  const pattern =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*([^*\n]+?)\*|`([^`]+)`|~~(.+?)~~|\[([^\]]+)\]\(([^)]+)\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    const [full] = match;
    if (full.startsWith('***')) {
      nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }, { type: 'italic' }] });
    } else if (full.startsWith('**') || full.startsWith('__')) {
      nodes.push({ type: 'text', text: match[3] || match[4], marks: [{ type: 'bold' }] });
    } else if (full.startsWith('_') || full.startsWith('*')) {
      nodes.push({ type: 'text', text: match[5] || match[6], marks: [{ type: 'italic' }] });
    } else if (full.startsWith('`')) {
      nodes.push({ type: 'text', text: match[7], marks: [{ type: 'code' }] });
    } else if (full.startsWith('~~')) {
      nodes.push({ type: 'text', text: match[8], marks: [{ type: 'strike' }] });
    } else if (full.startsWith('[')) {
      nodes.push({ type: 'text', text: match[9], marks: [{ type: 'link', attrs: { href: match[10] } }] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return nodes.filter((n) => n.text.length > 0);
}

/** Wrap inline nodes in a paragraph node */
function paragraph(inlineText: string): object {
  const content = parseInline(inlineText);
  return {
    type: 'paragraph',
    content: content.length > 0 ? content : [{ type: 'text', text: '' }],
  };
}

// ─── GFM Table parser ────────────────────────────────────────────────────────

function parseTableToTipTap(lines: string[]): object {
  // lines[0] = header row, lines[1] = separator, lines[2..] = body rows
  const parseRow = (line: string): string[] =>
    line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());

  const headerCells = parseRow(lines[0]);
  const bodyLines = lines.slice(2).filter(Boolean);

  const makeCell = (text: string, isHeader: boolean): object => ({
    type: isHeader ? 'tableHeader' : 'tableCell',
    attrs: { colspan: 1, rowspan: 1, colwidth: null },
    content: [paragraph(text)],
  });

  const headerRow = {
    type: 'tableRow',
    content: headerCells.map((c) => makeCell(c, true)),
  };

  const bodyRows = bodyLines.map((line) => ({
    type: 'tableRow',
    content: parseRow(line).map((c) => makeCell(c, false)),
  }));

  return {
    type: 'table',
    content: [headerRow, ...bodyRows],
  };
}

// ─── Block-level parsers ─────────────────────────────────────────────────────

function parseHeading(line: string): object {
  const m = line.match(/^(#{1,6})\s+(.+)$/);
  if (!m) return paragraph(line);
  return {
    type: 'heading',
    attrs: { level: m[1].length },
    content: parseInline(m[2]),
  };
}

function parseBulletList(lines: string[]): object {
  return {
    type: 'bulletList',
    content: lines
      .filter((l) => /^[-*+] /.test(l.trim()))
      .map((l) => ({
        type: 'listItem',
        content: [paragraph(l.replace(/^[-*+] /, ''))],
      })),
  };
}

function parseOrderedList(lines: string[]): object {
  return {
    type: 'orderedList',
    attrs: { start: 1 },
    content: lines
      .filter((l) => /^\d+\. /.test(l.trim()))
      .map((l) => ({
        type: 'listItem',
        content: [paragraph(l.replace(/^\d+\. /, ''))],
      })),
  };
}

function parseBlockquote(lines: string[]): object {
  return {
    type: 'blockquote',
    content: lines.map((l) => paragraph(l.replace(/^> ?/, ''))),
  };
}

function parseCodeBlock(code: string): object {
  return {
    type: 'codeBlock',
    attrs: { language: null },
    content: [{ type: 'text', text: code }],
  };
}

// ─── Main converter ──────────────────────────────────────────────────────────

/**
 * Parse GFM Markdown into an array of TipTap JSON content nodes.
 * These can be passed directly to editor.chain().insertContent(nodes).run()
 */
export function parseMarkdownToTipTap(markdown: string): object[] {
  if (!markdown?.trim()) return [];

  const nodes: object[] = [];
  const rawLines = markdown.split('\n');
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (!trimmed) { i++; continue; }

    // Fenced code block ```...```
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(parseCodeBlock(codeLines.join('\n')));
      continue;
    }

    // Heading
    if (/^#{1,6} /.test(trimmed)) {
      nodes.push(parseHeading(trimmed));
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      nodes.push({ type: 'horizontalRule' });
      i++;
      continue;
    }

    // GFM Table — collect contiguous pipe rows
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      // Need at least header + separator + 1 data row
      if (tableLines.length >= 3 && /^\|[-: |]+\|$/.test(tableLines[1])) {
        nodes.push(parseTableToTipTap(tableLines));
      } else {
        // Fallback: treat as paragraph
        tableLines.forEach((l) => nodes.push(paragraph(l)));
      }
      continue;
    }

    // Blockquote — collect contiguous > lines
    if (trimmed.startsWith('>')) {
      const bqLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        bqLines.push(rawLines[i].trim());
        i++;
      }
      nodes.push(parseBlockquote(bqLines));
      continue;
    }

    // Bullet list — collect contiguous - / * / + lines
    if (/^[-*+] /.test(trimmed)) {
      const listLines: string[] = [];
      while (i < rawLines.length && /^[-*+] /.test(rawLines[i].trim())) {
        listLines.push(rawLines[i].trim());
        i++;
      }
      nodes.push(parseBulletList(listLines));
      continue;
    }

    // Ordered list — collect contiguous 1. 2. lines
    if (/^\d+\. /.test(trimmed)) {
      const listLines: string[] = [];
      while (i < rawLines.length && /^\d+\. /.test(rawLines[i].trim())) {
        listLines.push(rawLines[i].trim());
        i++;
      }
      nodes.push(parseOrderedList(listLines));
      continue;
    }

    // Math & Notation tags inside markdown -> turn into native editable nodes
    if (/^<(mathjax|abcjs)>/i.test(trimmed)) {
      const isMath = /^<mathjax>/i.test(trimmed);
      const cleaned = trimmed
        .replace(/^<mathjax>\s*/i, '')
        .replace(/\s*<\/mathjax>$/i, '')
        .replace(/^<abcjs>\s*/i, '')
        .replace(/\s*<\/abcjs>$/i, '');
      if (isMath) {
        nodes.push({ type: 'mathJax', attrs: { latex: cleaned } });
      } else {
        nodes.push({ type: 'abcJs', attrs: { abc: cleaned } });
      }
      i++;
      continue;
    }

    // Standalone $$ ... $$ lines in markdown -> turn into mathJax node
    if (/^\$\$([\s\S]+?)\$\$$/.test(trimmed)) {
      const match = trimmed.match(/^\$\$([\s\S]+?)\$\$$/);
      if (match && match[1]) {
        nodes.push({ type: 'mathJax', attrs: { latex: match[1].trim() } });
        i++;
        continue;
      }
    }

    // Regular paragraph
    nodes.push(paragraph(trimmed));
    i++;
  }

  return nodes;
}

// ─── OCR segment parser (kept for OCR tab) ───────────────────────────────────

export interface OcrSegment {
  type: 'tiptap' | 'mathjax' | 'abcjs';
  content: string;
  nodes?: object[];
}

export function parseOcrOutput(raw: string): OcrSegment[] {
  const segments: OcrSegment[] = [];
  const parts = raw.split(/(<mathjax>[\s\S]*?<\/mathjax>|<abcjs>[\s\S]*?<\/abcjs>)/gi);
  for (const part of parts) {
    const mathMatch = part.match(/^<mathjax>([\s\S]*?)<\/mathjax>$/i);
    const abcMatch  = part.match(/^<abcjs>([\s\S]*?)<\/abcjs>$/i);
    if (mathMatch)        segments.push({ type: 'mathjax', content: mathMatch[1].trim() });
    else if (abcMatch)    segments.push({ type: 'abcjs',   content: abcMatch[1].trim() });
    else if (part.trim()) segments.push({ type: 'tiptap', content: part, nodes: parseMarkdownToTipTap(part) });
  }
  return segments;
}

// Keep backward-compat export for any remaining HTML usage
export function parseMarkdownToHtml(markdown: string): string {
  // Simple fallback for non-TipTap usage
  return markdown
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
