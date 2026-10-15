// Print the rendered document, not the app. Everything travels into an isolated
// iframe as finished markup: the print frame inherits the app's CSP
// (script-src 'self'), so Mermaid and KaTeX have to run out here, in the window
// that already has them loaded.
import { renderMarkdown } from "$lib/markdown/renderer";
import { renderMermaidSvg } from "$lib/markdown/mermaid";
import { renderDiagramsIn } from "$lib/markdown/diagrams";
import { BASE_CSS, parseBody, serializeBody, standaloneHtml, varBlock } from "$lib/doc-html";
import { inlineLocalImagesIn, loadKatexCss, readThemeVars } from "$lib/doc-assets";
import { PRINT_CSS } from "$lib/print-css";
import { settings } from "$lib/stores/settings.svelte";
import { toasts } from "$lib/stores/toasts.svelte";
import { t } from "$lib/i18n";

// A real, laid-out page placed off-screen. A 0x0 frame is "not rendered" enough
// that font loading and rAF become a matter of opinion; 816x1056 is Letter at
// 96dpi, which makes the readiness chain below deterministic. Never
// visibility:hidden — that suppresses the font loads we are waiting for.
const PAPER = "position:fixed;left:-10000px;top:0;width:816px;height:1056px;border:0;";

/** Races a promise against a timer that *resolves*: a stuck font or image fetch
 *  must not be able to stop the user from printing. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([p, new Promise<void>((resolve) => setTimeout(resolve, ms))]);
}

/** Parent-window frames, to sidestep any throttling of the child frame. */
function nextFrames(n: number): Promise<void> {
  return new Promise((resolve) => {
    const step = () => (--n > 0 ? requestAnimationFrame(step) : resolve());
    requestAnimationFrame(step);
  });
}

/** The document as a self-contained, printable HTML string. Exported separately
 *  from printDocument so the printed artifact itself can be inspected. */
export async function buildPrintableHtml(
  content: string,
  basePath: string | null,
  title: string,
): Promise<{ html: string; failed: number }> {
  const body = parseBody(renderMarkdown(content, basePath));
  const { failed } = await renderDiagramsIn(body, renderMermaidSvg);
  await inlineLocalImagesIn(body);
  const css = [
    BASE_CSS,
    // Printing follows the app's theme, so the paper matches what was on screen.
    varBlock(readThemeVars(), settings.resolvedTheme),
    await loadKatexCss(),
    PRINT_CSS,
  ];
  return { html: standaloneHtml({ body: serializeBody(body), title, css }), failed };
}

async function printFrame(html: string): Promise<void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("tabindex", "-1");
  frame.style.cssText = PAPER;
  // Hooked up before srcdoc, or a cached-fast load can beat the listener.
  const loaded = new Promise<void>((resolve) => {
    frame.onload = () => resolve();
    frame.onerror = () => resolve();
  });
  frame.srcdoc = html;
  document.body.appendChild(frame);
  try {
    await withTimeout(loaded, 10_000); // document, stylesheets and <img>
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) throw new Error("print frame has no document");
    // load does not cover web fonts, and KaTeX ships font-display: block — print
    // too early and the math comes out as blank glyphs, not fallback ones.
    await withTimeout(doc.fonts.ready, 3_000);
    await withTimeout(
      Promise.all(Array.from(doc.images).map((img) => img.decode().catch(() => {}))),
      2_000,
    );
    await nextFrames(2); // one layout+paint after the font swap
    win.focus();
    win.print();
  } finally {
    setTimeout(() => frame.remove(), 1000);
  }
}

let printing = false;

/** Open the system print dialog on the rendered document. */
export async function printDocument(
  content: string,
  basePath: string | null,
  title: string,
): Promise<void> {
  // Loading Mermaid is the heaviest chunk in the app, so the prep can take a
  // second or two — say so, and ignore a second Ctrl+P meanwhile.
  if (printing) return;
  printing = true;
  const notice = toasts.show(t("toast.printing"), "info", 30_000);
  try {
    const { html, failed } = await buildPrintableHtml(content, basePath, title);
    if (failed > 0) toasts.error(t("toast.diagramsFailed", { n: failed }));
    await printFrame(html);
  } catch (e) {
    toasts.error(t("toast.printFail"), e);
  } finally {
    toasts.dismiss(notice);
    printing = false;
  }
}
