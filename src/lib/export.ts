// Export the rendered document as a standalone HTML file, or to PDF via the
// system print dialog (an isolated iframe so only the document prints).
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { renderMarkdown } from "$lib/markdown/renderer";
import { toasts } from "$lib/stores/toasts.svelte";
import { t } from "$lib/i18n";

// Self-contained light-theme styling so the exported file looks good anywhere.
const EXPORT_CSS = `
  :root { color-scheme: light; }
  body { margin: 0; background: #fff; color: #1f2328;
    font: 16px/1.6 "Segoe UI", system-ui, sans-serif; }
  .markdown-body { max-width: 820px; margin: 0 auto; padding: 48px 32px; }
  h1, h2 { border-bottom: 1px solid #e1e4e8; padding-bottom: .3em; }
  h1, h2, h3, h4 { margin: 1.4em 0 .6em; line-height: 1.25; }
  a { color: #2563eb; }
  code { background: #f6f8fa; padding: .15em .35em; border-radius: 4px;
    font-family: "Cascadia Code", Consolas, monospace; font-size: .9em; }
  pre { background: #f6f8fa; padding: 12px 14px; border-radius: 8px; overflow: auto; }
  pre code { background: none; padding: 0; }
  blockquote { margin: 0; padding-left: 1em; border-left: 3px solid #e1e4e8; color: #6b7280; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #e1e4e8; padding: 6px 12px; }
  img { max-width: 100%; }
  .task-list-item { list-style: none; }
  .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section { color: #cf222e; }
  .hljs-string { color: #0a3069; }
  .hljs-comment, .hljs-quote { color: #6e7781; font-style: italic; }
  .hljs-number, .hljs-symbol { color: #0550ae; }
  .hljs-title, .hljs-name, .hljs-type { color: #8250df; }
  .hljs-attr, .hljs-attribute, .hljs-variable { color: #116329; }
  .hljs-built_in, .hljs-meta { color: #953800; }
  @media print { body { background: #fff; } .markdown-body { padding: 0; max-width: none; } }
`;

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function standaloneHtml(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${EXPORT_CSS}</style></head>
<body><main class="markdown-body">${bodyHtml}</main></body></html>`;
}

/** Save the document as a standalone .html file (relative image paths kept). */
export async function exportHtml(content: string, title: string): Promise<void> {
  try {
    const html = standaloneHtml(renderMarkdown(content, null), title);
    const path = await save({
      filters: [{ name: "HTML", extensions: ["html"] }],
      defaultPath: `${title}.html`,
    });
    if (!path) return;
    await writeTextFile(path, html);
    toasts.success(t("toast.exportedHtml"));
  } catch (e) {
    toasts.error(t("toast.exportHtmlFail"), e);
  }
}

/** Copy the rendered document to the clipboard as rich HTML (and plain text). */
export async function copyAsHtml(content: string): Promise<void> {
  const html = renderMarkdown(content, null);
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([html], { type: "text/plain" }),
      }),
    ]);
    toasts.success(t("toast.copiedHtml"));
  } catch {
    try {
      await navigator.clipboard.writeText(html); // fallback: plain text only
      toasts.success(t("toast.copiedHtmlPlain"));
    } catch (e) {
      toasts.error(t("toast.copyFail"), e);
    }
  }
}

/** Print the document via an isolated iframe so the user can "Save as PDF". */
export function exportPdf(content: string, basePath: string | null, title: string): void {
  let html: string;
  try {
    html = standaloneHtml(renderMarkdown(content, basePath), title);
  } catch (e) {
    toasts.error(t("toast.pdfFail"), e);
    return;
  }
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.srcdoc = html;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  document.body.appendChild(iframe);
}
