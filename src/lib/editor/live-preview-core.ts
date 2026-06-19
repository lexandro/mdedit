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
