/**
 * markdownToTipTap.ts
 * Converts GFM Markdown directly into TipTap-compatible JSON content nodes.
 * Using JSON nodes (not HTML strings) is the most reliable way to insert
 * formatted, editable content into TipTap.
 */

// ─── Inline mark parsing ────────────────────────────────────────────────────

interface TextNode {
  type: "text";
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
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    const [full] = match;
    if (full.startsWith("***")) {
      nodes.push({
        type: "text",
        text: match[2],
        marks: [{ type: "bold" }, { type: "italic" }],
      });
    } else if (full.startsWith("**") || full.startsWith("__")) {
      nodes.push({
        type: "text",
        text: match[3] || match[4],
        marks: [{ type: "bold" }],
      });
    } else if (full.startsWith("_") || full.startsWith("*")) {
      nodes.push({
        type: "text",
        text: match[5] || match[6],
        marks: [{ type: "italic" }],
      });
    } else if (full.startsWith("`")) {
      nodes.push({ type: "text", text: match[7], marks: [{ type: "code" }] });
    } else if (full.startsWith("~~")) {
      nodes.push({ type: "text", text: match[8], marks: [{ type: "strike" }] });
    } else if (full.startsWith("[")) {
      nodes.push({
        type: "text",
        text: match[9],
        marks: [{ type: "link", attrs: { href: match[10] } }],
      });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes.filter((n) => n.text.length > 0);
}

/** Wrap inline nodes in a paragraph node */
function paragraph(inlineText: string): object {
  const content = parseInline(inlineText);
  return {
    type: "paragraph",
    content: content.length > 0 ? content : [{ type: "text", text: "" }],
  };
}

// ─── GFM Table parser ────────────────────────────────────────────────────────

function parseTableToTipTap(lines: string[]): object {
  // lines[0] = header row, lines[1] = separator, lines[2..] = body rows
  const parseRow = (line: string): string[] =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());

  const headerCells = parseRow(lines[0]);
  const bodyLines = lines.slice(2).filter(Boolean);

  const makeCell = (text: string, isHeader: boolean): object => ({
    type: isHeader ? "tableHeader" : "tableCell",
    attrs: { colspan: 1, rowspan: 1, colwidth: null },
    content: [paragraph(text)],
  });

  const headerRow = {
    type: "tableRow",
    content: headerCells.map((c) => makeCell(c, true)),
  };

  const bodyRows = bodyLines.map((line) => ({
    type: "tableRow",
    content: parseRow(line).map((c) => makeCell(c, false)),
  }));

  return {
    type: "table",
    content: [headerRow, ...bodyRows],
  };
}

// ─── Block-level parsers ─────────────────────────────────────────────────────

function parseHeading(line: string): object {
  const m = line.match(/^(#{1,6})\s+(.+)$/);
  if (!m) return paragraph(line);
  return {
    type: "heading",
    attrs: { level: m[1].length },
    content: parseInline(m[2]),
  };
}

function parseBulletList(lines: string[]): object {
  return {
    type: "bulletList",
    content: lines
      .filter((l) => /^[-*+] /.test(l.trim()))
      .map((l) => ({
        type: "listItem",
        content: [paragraph(l.replace(/^[-*+] /, ""))],
      })),
  };
}

function parseOrderedList(lines: string[]): object {
  return {
    type: "orderedList",
    attrs: { start: 1 },
    content: lines
      .filter((l) => /^\d+\. /.test(l.trim()))
      .map((l) => ({
        type: "listItem",
        content: [paragraph(l.replace(/^\d+\. /, ""))],
      })),
  };
}

function parseBlockquote(lines: string[]): object {
  return {
    type: "blockquote",
    content: lines.map((l) => paragraph(l.replace(/^> ?/, ""))),
  };
}

function parseCodeBlock(code: string): object {
  return {
    type: "codeBlock",
    attrs: { language: null },
    content: [{ type: "text", text: code }],
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
  const rawLines = markdown.split("\n");
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block ```...```
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith("```")) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(parseCodeBlock(codeLines.join("\n")));
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
      nodes.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    // GFM Table — collect contiguous pipe rows
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith("|")) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      // Need at least header + separator (body rows optional)
      if (tableLines.length >= 2 && /^\|?[-: |]+\|?$/.test(tableLines[1])) {
        nodes.push(parseTableToTipTap(tableLines));
      } else {
        // Fallback: treat as paragraph
        tableLines.forEach((l) => nodes.push(paragraph(l)));
      }
      continue;
    }

    // Blockquote — collect contiguous > lines
    if (trimmed.startsWith(">")) {
      const bqLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith(">")) {
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
    const tagMatch = trimmed.match(/<(mathjax|abcjs)>/i);
    if (tagMatch) {
      const tagName = tagMatch[1].toLowerCase();
      const endTag = `</${tagName}>`;
      const endMatch = new RegExp(endTag, "i").exec(trimmed);

      if (endMatch) {
        const content = trimmed
          .substring(tagMatch.index + tagMatch[0].length, endMatch.index)
          .trim();
        if (tagName === "mathjax")
          nodes.push({ type: "mathJax", attrs: { latex: content } });
        else nodes.push({ type: "abcJs", attrs: { abc: content } });
        i++;
        continue;
      }

      let tagLines: string[] = [];
      const rest = trimmed
        .substring(tagMatch.index + tagMatch[0].length)
        .trim();
      if (rest) tagLines.push(rest);

      i++;
      let closed = false;
      while (i < rawLines.length) {
        const matchClose = new RegExp(`(.*)${endTag}`, "i").exec(rawLines[i]);
        if (matchClose) {
          if (matchClose[1].trim()) tagLines.push(matchClose[1].trim());
          closed = true;
          i++;
          break;
        }
        tagLines.push(rawLines[i]);
        i++;
      }

      if (closed) {
        const content = tagLines.join("\n").trim();
        if (tagName === "mathjax")
          nodes.push({ type: "mathJax", attrs: { latex: content } });
        else nodes.push({ type: "abcJs", attrs: { abc: content } });
        continue;
      }
    }

    // Standalone $$ ... $$ lines in markdown -> turn into mathJax node
    if (trimmed.startsWith("$$")) {
      if (trimmed.endsWith("$$") && trimmed.length > 2) {
        nodes.push({
          type: "mathJax",
          attrs: { latex: trimmed.slice(2, -2).trim() },
        });
        i++;
        continue;
      }

      let mathLines: string[] = [];
      if (trimmed.length > 2) mathLines.push(trimmed.slice(2).trim());
      i++;

      let closed = false;
      while (i < rawLines.length) {
        const tLine = rawLines[i].trim();
        if (tLine.endsWith("$$")) {
          const inner = tLine.slice(0, -2).trim();
          if (inner) mathLines.push(inner);
          closed = true;
          i++;
          break;
        }
        mathLines.push(rawLines[i]);
        i++;
      }

      if (closed) {
        nodes.push({
          type: "mathJax",
          attrs: { latex: mathLines.join("\n").trim() },
        });
        continue;
      }
    }

    // ABC Notation blocks (standard string preamble X: ... T: ...)
    if (
      /^X:\s*\d+/i.test(trimmed) &&
      i + 1 < rawLines.length &&
      /^T:/i.test(rawLines[i + 1].trim())
    ) {
      const abcLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim() !== "") {
        abcLines.push(rawLines[i]);
        i++;
      }
      nodes.push({ type: "abcJs", attrs: { abc: abcLines.join("\n") } });
      continue;
    }

    // Regular paragraph
    nodes.push(paragraph(trimmed));
    i++;
  }

  return nodes;
}

// ─── Editor format preservation ──────────────────────────────────────────────

/**
 * Read the editor's active text-style marks (fontFamily, fontSize) and
 * paragraph-level attributes (lineHeight, textAlign) from the current
 * selection so we can propagate them to AI-generated nodes.
 */
export function getActiveEditorFormat(editor: any): {
  marks: { type: string; attrs?: Record<string, string> }[];
  blockAttrs: Record<string, string>;
} {
  if (!editor) return { marks: [], blockAttrs: {} };

  const marks: { type: string; attrs?: Record<string, string> }[] = [];
  const blockAttrs: Record<string, string> = {};

  try {
    // ── Inline marks (textStyle carries fontFamily / fontSize) ──────────
    const storedMarks = editor.state.storedMarks || editor.state.selection.$from.marks();
    const textStyleMark = storedMarks?.find((m: any) => m.type.name === 'textStyle');
    if (textStyleMark) {
      const attrs: Record<string, string> = {};
      if (textStyleMark.attrs.fontFamily) attrs.fontFamily = textStyleMark.attrs.fontFamily;
      if (textStyleMark.attrs.fontSize) attrs.fontSize = textStyleMark.attrs.fontSize;
      if (Object.keys(attrs).length > 0) {
        marks.push({ type: 'textStyle', attrs });
      }
    }

    // ── Block-level attributes (lineHeight, textAlign) ──────────────────
    const { $from } = editor.state.selection;
    const parentNode = $from.parent;
    if (parentNode) {
      if (parentNode.attrs.lineHeight) blockAttrs.lineHeight = parentNode.attrs.lineHeight;
      if (parentNode.attrs.textAlign && parentNode.attrs.textAlign !== 'left') {
        blockAttrs.textAlign = parentNode.attrs.textAlign;
      }
    }
  } catch (_e) {
    // Graceful fallback — return empty format
  }

  return { marks, blockAttrs };
}

/**
 * Apply the editor's active formatting to an array of TipTap JSON nodes
 * produced by `parseMarkdownToTipTap()`.
 *
 * - Inline text nodes receive the textStyle marks (fontFamily, fontSize).
 * - Block-level nodes (paragraph, heading, listItem children) receive
 *   lineHeight and textAlign attributes.
 */
export function applyEditorFormatToNodes(
  nodes: object[],
  format: ReturnType<typeof getActiveEditorFormat>,
): object[] {
  if (format.marks.length === 0 && Object.keys(format.blockAttrs).length === 0) {
    return nodes; // nothing to apply
  }

  return nodes.map((node) => applyFormatRecursive(node as any, format));
}

function applyFormatRecursive(
  node: any,
  format: ReturnType<typeof getActiveEditorFormat>,
): any {
  // ─── Text nodes: merge textStyle marks ───────────────────────────────
  if (node.type === 'text') {
    if (format.marks.length === 0) return node;
    const existingMarks: any[] = node.marks || [];
    // Don't overwrite if textStyle already present (e.g. bold text with explicit font)
    const hasTextStyle = existingMarks.some((m: any) => m.type === 'textStyle');
    if (hasTextStyle) return node;
    return { ...node, marks: [...existingMarks, ...format.marks] };
  }

  // ─── Block nodes: apply lineHeight/textAlign attrs ───────────────────
  const blockTypes = ['paragraph', 'heading'];
  let updated = node;
  if (blockTypes.includes(node.type) && Object.keys(format.blockAttrs).length > 0) {
    updated = {
      ...node,
      attrs: { ...(node.attrs || {}), ...format.blockAttrs },
    };
  }

  // ─── Recurse into children ───────────────────────────────────────────
  if (updated.content && Array.isArray(updated.content)) {
    updated = {
      ...updated,
      content: updated.content.map((child: any) => applyFormatRecursive(child, format)),
    };
  }

  return updated;
}

// ─── OCR segment parser (kept for OCR tab) ───────────────────────────────────

export interface OcrSegment {
  type: "tiptap" | "mathjax" | "abcjs";
  content: string;
  nodes?: object[];
}

export function parseOcrOutput(raw: string): OcrSegment[] {
  const segments: OcrSegment[] = [];
  const parts = raw.split(
    /(<mathjax>[\s\S]*?<\/mathjax>|<abcjs>[\s\S]*?<\/abcjs>)/gi,
  );
  for (const part of parts) {
    const mathMatch = part.match(/^<mathjax>([\s\S]*?)<\/mathjax>$/i);
    const abcMatch = part.match(/^<abcjs>([\s\S]*?)<\/abcjs>$/i);
    if (mathMatch)
      segments.push({ type: "mathjax", content: mathMatch[1].trim() });
    else if (abcMatch)
      segments.push({ type: "abcjs", content: abcMatch[1].trim() });
    else if (part.trim())
      segments.push({
        type: "tiptap",
        content: part,
        nodes: parseMarkdownToTipTap(part),
      });
  }
  return segments;
}

// Keep backward-compat export for any remaining HTML usage
export function parseMarkdownToHtml(markdown: string): string {
  // Simple fallback for non-TipTap usage
  return markdown
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}
