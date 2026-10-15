// Export the rendered document as a standalone HTML file or to the clipboard.
// The document-building blocks are shared with printing: doc-html (strings),
// doc-assets (webview/bundler) and markdown/diagrams.
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { renderMarkdown } from "$lib/markdown/renderer";
import { renderMermaidSvg } from "$lib/markdown/mermaid";
import { renderDiagramsIn } from "$lib/markdown/diagrams";
import {
  BASE_CSS,
  LIGHT_VARS,
  parseBody,
  serializeBody,
  standaloneHtml,
  varBlock,
} from "$lib/doc-html";
import { inlineLocalImagesIn, loadKatexCss } from "$lib/doc-assets";
import { PRINT_CSS } from "$lib/print-css";
import { toasts } from "$lib/stores/toasts.svelte";
import { t } from "$lib/i18n";

/** A shared .html file is read on someone else's screen, so it carries the
 *  light palette regardless of the theme the app happens to be in. */
async function exportCss(): Promise<string[]> {
  return [BASE_CSS, varBlock(LIGHT_VARS, "light"), await loadKatexCss(), PRINT_CSS];
}

/** Save the document as a standalone .html file: diagrams drawn, local images
 *  inlined as base64, so the file stands on its own anywhere. */
export async function exportHtml(
  content: string,
  basePath: string | null,
  title: string,
): Promise<void> {
  try {
    const body = parseBody(renderMarkdown(content, basePath));
    // The file is light-themed wherever the app is, so the diagrams must be too.
    const { failed } = await renderDiagramsIn(body, (code) => renderMermaidSvg(code, "default"));
    if (failed > 0) toasts.error(t("toast.diagramsFailed", { n: failed }));
    await inlineLocalImagesIn(body);
    const html = standaloneHtml({ body: serializeBody(body), title, css: await exportCss() });
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

/** Copy the rendered document to the clipboard as rich HTML (and plain text).
 *  Diagrams stay as source text on purpose: clipboard consumers (Word, Outlook)
 *  don't take inline SVG reliably, and dropped SVG would paste as nothing. */
export async function copyAsHtml(content: string): Promise<void> {
  const body = parseBody(renderMarkdown(content, null));
  await inlineLocalImagesIn(body);
  const html = serializeBody(body);
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
