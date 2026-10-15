// Shared building blocks for the self-contained HTML this app emits: the export
// file, the clipboard payload and the print document. String work only, so both
// paths serialize a document identically and this is testable in isolation.

/** Theme tokens `BASE_CSS` references. The two font tokens ride along because
 *  the stylesheet uses them; the rest is the light/dark palette of app.css. */
export const THEME_TOKENS = [
  "--bg",
  "--bg-alt",
  "--fg",
  "--fg-muted",
  "--border",
  "--accent",
  "--accent-fg",
  "--code-bg",
  "--hl-keyword",
  "--hl-string",
  "--hl-comment",
  "--hl-number",
  "--hl-title",
  "--hl-attr",
  "--hl-builtin",
  "--mono-font",
  "--ui-font",
] as const;

/** app.css's light palette, for output that must not follow the app theme: a
 *  shared .html file is read on someone else's screen, not on ours. */
export const LIGHT_VARS: Record<string, string> = {
  "--bg": "#ffffff",
  "--bg-alt": "#f3f3f3",
  "--fg": "#1f2328",
  "--fg-muted": "#6b7280",
  "--border": "#e1e4e8",
  "--accent": "#2563eb",
  "--accent-fg": "#ffffff",
  "--code-bg": "#f6f8fa",
  "--hl-keyword": "#cf222e",
  "--hl-string": "#0a3069",
  "--hl-comment": "#6e7781",
  "--hl-number": "#0550ae",
  "--hl-title": "#8250df",
  "--hl-attr": "#116329",
  "--hl-builtin": "#953800",
  "--mono-font": '"Cascadia Code", "Consolas", "Fira Code", ui-monospace, monospace',
  "--ui-font": '"Segoe UI", system-ui, sans-serif',
};

/** Emit the token values as a `:root` block. `color-scheme` rides with them
 *  because it drives the UA colors the palette can't reach (task-list
 *  checkboxes, the default canvas). */
export function varBlock(vars: Record<string, string>, colorScheme: "light" | "dark"): string {
  const decls = Object.entries(vars).map(([k, v]) => `${k}:${v};`);
  return `:root{color-scheme:${colorScheme};${decls.join("")}}`;
}

// A var-driven copy of app.css's `.markdown-body` rules, so an exported or
// printed document looks like the preview it was rendered in. Kept in sync by
// hand: app.css can use the app's chrome, this has to stand alone.
export const BASE_CSS = `
  body { margin: 0; background: var(--bg); color: var(--fg);
    font: 16px/1.6 var(--ui-font); }
  .markdown-body { max-width: 820px; margin: 0 auto; padding: 48px 32px; }
  .markdown-body .frontmatter { margin: 0 0 1rem; padding: 8px 12px;
    background: var(--bg-alt); border: 1px solid var(--border);
    border-left: 3px solid var(--accent); border-radius: 6px;
    color: var(--fg-muted); font-size: 12px; white-space: pre-wrap; }
  .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid var(--border);
    padding-bottom: .3em; }
  .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
    margin: 1.4em 0 .6em; line-height: 1.25; }
  .markdown-body a { color: var(--accent); }
  .markdown-body code { background: var(--code-bg); padding: .15em .35em;
    border-radius: 4px; font-family: var(--mono-font); font-size: .9em; }
  .markdown-body pre { background: var(--code-bg); padding: 12px 14px;
    border-radius: 8px; overflow: auto; }
  .markdown-body pre code { background: none; padding: 0; }
  .markdown-body blockquote { margin: 0; padding-left: 1em;
    border-left: 3px solid var(--border); color: var(--fg-muted); }
  .markdown-body table { border-collapse: collapse; }
  .markdown-body th, .markdown-body td { border: 1px solid var(--border);
    padding: 6px 12px; }
  .markdown-body img { max-width: 100%; }
  .markdown-body .task-list-item { list-style: none; }
  .markdown-body .task-list-item input { margin: 0 .4em 0 -1.4em; }
  .markdown-body pre.mermaid, .markdown-body .mermaid-svg { background: none;
    text-align: center; }
  .markdown-body dt { font-weight: 600; margin-top: .6em; }
  .markdown-body dd { margin: 0 0 .4em 1.5em; }
  .markdown-body .footnotes { border-top: 1px solid var(--border);
    margin-top: 2em; padding-top: .5em; font-size: .9em; color: var(--fg-muted); }
  .markdown-body sup.footnote-ref a { text-decoration: none; }
  .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section { color: var(--hl-keyword); }
  .hljs-string, .hljs-meta-string { color: var(--hl-string); }
  .hljs-comment, .hljs-quote { color: var(--hl-comment); font-style: italic; }
  .hljs-number, .hljs-symbol { color: var(--hl-number); }
  .hljs-title, .hljs-name, .hljs-type { color: var(--hl-title); }
  .hljs-attr, .hljs-attribute, .hljs-variable { color: var(--hl-attr); }
  .hljs-built_in, .hljs-builtin-name, .hljs-meta { color: var(--hl-builtin); }
  .hljs-emphasis { font-style: italic; }
  .hljs-strong { font-weight: 700; }
`;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

/** Parse a rendered-markdown fragment into a detached body element. The export
 *  and print passes share one parse/serialize round so their output can't drift. */
export function parseBody(html: string): HTMLElement {
  return new DOMParser().parseFromString(html, "text/html").body;
}

export function serializeBody(body: HTMLElement): string {
  return body.innerHTML;
}

/** Wrap a body fragment in a standalone document. `css` is emitted in order, so
 *  the caller decides what overrides what (print rules go last). */
export function standaloneHtml({
  body,
  title,
  css,
}: {
  body: string;
  title: string;
  css: string[];
}): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${css.join("\n")}</style></head>
<body><main class="markdown-body">${body}</main></body></html>`;
}
