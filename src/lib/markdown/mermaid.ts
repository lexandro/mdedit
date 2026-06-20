// Shared Mermaid rendering, used by the preview and the Live-mode editor widget.
import mermaid from "mermaid";
import { settings } from "$lib/stores/settings.svelte";

let seq = 0;

/** Render Mermaid `code` to an SVG string, themed to match the app. Throws on
 *  invalid diagrams so callers can show their own error UI. */
export async function renderMermaidSvg(code: string): Promise<string> {
  mermaid.initialize({
    startOnLoad: false,
    theme: settings.resolvedTheme === "dark" ? "dark" : "default",
    securityLevel: "strict",
  });
  const { svg } = await mermaid.render(`mmd-${seq++}`, code);
  return svg;
}
