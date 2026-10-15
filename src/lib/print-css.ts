// Paged-media rules for every document that may reach a printer: the print
// iframe and the exported .html file. Each rule is here because Chromium's
// print path breaks something the screen view gets right.
//
// Selectors stay scoped to `.markdown-body` wherever BASE_CSS also sets the
// property — a bare `pre` would lose the specificity fight against
// `.markdown-body pre` no matter how late it comes.
export const PRINT_CSS = `
@page { margin: 16mm 14mm; }
@media print {
  /* Chromium's print preview has "Background graphics" off by default, which
     would drop code-block tints, table shading and the frontmatter box. */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 11pt; }
  .markdown-body { max-width: none; padding: 0; }
  /* The screen view scrolls long lines; paper can't, so wrap instead of clip. */
  .markdown-body pre { overflow: visible; white-space: pre-wrap; overflow-wrap: anywhere; }
  .markdown-body h1, .markdown-body h2, .markdown-body h3,
  .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    break-after: avoid-page; break-inside: avoid; }
  .markdown-body p, .markdown-body li, .markdown-body blockquote { orphans: 3; widows: 3; }
  /* Repeat the header of a table that spans pages. Never break-inside a
     <table> itself — Chromium then clips it to the first page. */
  .markdown-body thead { display: table-header-group; }
  .markdown-body tfoot { display: table-footer-group; }
  .markdown-body tr, .markdown-body th, .markdown-body td,
  .markdown-body pre, .markdown-body blockquote { break-inside: avoid; }
  /* Scale a figure down rather than let it be clipped; break-inside: avoid on
     something taller than a page makes Chromium cut it off. Mermaid ships
     width="100%" plus an inline max-width, so the width must not be forced. */
  .markdown-body img, .markdown-body svg {
    max-width: 100%; height: auto; max-height: 92vh; break-inside: avoid; }
  .markdown-body .mermaid-svg { break-inside: avoid; }
  /* KaTeX sets white-space: nowrap on display math, which paper cuts off. */
  .katex-display { break-inside: avoid; overflow: visible; }
  .katex-display > .katex { white-space: normal; }
}
`;
