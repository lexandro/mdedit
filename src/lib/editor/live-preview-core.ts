// Pure helpers for the live-preview (WYSIWYG) CodeMirror extension. The CM glue
// in live-preview.ts walks the Markdown syntax tree and calls these; keeping the
// decisions here makes them unit-testable without a CodeMirror instance.

/** CSS class for an ATX heading of the given level (clamped to 1–6). */
export function headingClass(level: number): string {
  return `cm-lp-h${Math.min(6, Math.max(1, level))}`;
}

/** Lezer-markdown node names → inline style class applied over the node. */
export const STYLE_CLASS: Record<string, string> = {
  StrongEmphasis: "cm-lp-strong",
  Emphasis: "cm-lp-em",
  InlineCode: "cm-lp-code",
  Strikethrough: "cm-lp-strike",
};

/** Syntax-marker node names whose characters are hidden unless their line is active. */
export const MARKER_NODES = new Set(["HeaderMark", "EmphasisMark", "StrikethroughMark", "CodeMark"]);

/** A marker stays rendered (hidden) only when its line is not currently being edited. */
export function markerHidden(markerLine: number, activeLines: Set<number>): boolean {
  return !activeLines.has(markerLine);
}

/** Whether a link target is safe to open externally on Ctrl/Cmd-click. */
export function isFollowableUrl(url: string): boolean {
  return /^(https?:|mailto:)/i.test(url.trim());
}

/** Parse a standalone image token `![alt](url "title")` into its alt + url. */
export function parseImage(text: string): { alt: string; url: string } | null {
  const m = /^!\[([^\]]*)\]\(\s*(\S+?)\s*(?:"[^"]*")?\)$/.exec(text.trim());
  return m ? { alt: m[1], url: m[2] } : null;
}

export interface MathSpan {
  from: number;
  to: number;
  tex: string;
  display: boolean;
}

/**
 * Find TeX math spans in plain text: display `$$…$$` (may span lines) and inline
 * `$…$`. Conservative inline rule (no inner `$`, no surrounding whitespace, not
 * adjacent to digits) so prose like "$5 and $10" is left alone. Offsets are
 * indices into `text`. Code-context filtering happens in the CodeMirror layer.
 */
export function findMath(text: string): MathSpan[] {
  const spans: MathSpan[] = [];
  const covered: Array<[number, number]> = [];
  let m: RegExpExecArray | null;

  const display = /(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$/g;
  while ((m = display.exec(text))) {
    const to = m.index + m[0].length;
    spans.push({ from: m.index, to, tex: m[1].trim(), display: true });
    covered.push([m.index, to]);
  }

  const inline = /(?<![\\\d$])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?![\d$])/g;
  while ((m = inline.exec(text))) {
    const from = m.index;
    const to = from + m[0].length;
    if (covered.some(([a, b]) => from < b && to > a)) continue; // inside a $$…$$ span
    spans.push({ from, to, tex: m[1].trim(), display: false });
  }

  return spans.sort((a, b) => a.from - b.from);
}
