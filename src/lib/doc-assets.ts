// Impure half of the document pipeline: the parts that need the live webview
// (asset fetches, the app's resolved theme) or the bundler (KaTeX's stylesheet).
import { isInlinableAssetUrl } from "$lib/export-util";
import { THEME_TOKENS } from "$lib/doc-html";

/** Replace app-only asset:// image srcs with self-contained base64 data URIs so
 *  the document renders outside the app webview. Runs in the webview, where the
 *  asset URLs still resolve; a failed fetch leaves that src untouched. */
export async function inlineLocalImagesIn(root: ParentNode): Promise<void> {
  const imgs = [...root.querySelectorAll("img")].filter((img) =>
    isInlinableAssetUrl(img.getAttribute("src") ?? ""),
  );
  await Promise.all(
    imgs.map(async (img) => {
      try {
        const blob = await (await fetch(img.src)).blob();
        img.src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      } catch {
        /* leave the original src; a broken local image beats a failed export */
      }
    }),
  );
}

/** Read the app's live theme tokens. One source of truth: app.css. */
export function readThemeVars(root: Element = document.documentElement): Record<string, string> {
  const style = getComputedStyle(root);
  return Object.fromEntries(THEME_TOKENS.map((t) => [t, style.getPropertyValue(t).trim()]));
}

let katexCss: Promise<string> | null = null;

/** KaTeX's stylesheet as text, for documents that can't link app.css. Without
 *  it math renders *twice* — the `.katex-mathml` clip rule is what hides the
 *  MathML copy — so it is required, not cosmetic. Loaded on demand: 24 KB that
 *  only printing and exporting need. Vite resolves the font url()s to absolute
 *  URLs at runtime, so they stay same-origin and pass the CSP. */
export function loadKatexCss(): Promise<string> {
  katexCss ??= import("katex/dist/katex.min.css?inline").then((m) => m.default);
  return katexCss;
}
