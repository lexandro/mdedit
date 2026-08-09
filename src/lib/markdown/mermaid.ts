// Shared Mermaid rendering, used by the preview and the Live-mode editor widget.
// Mermaid (with cytoscape/dagre) is by far the heaviest dependency, and most
// documents contain no diagrams at all, so it is imported on first use. Both
// callers already await this function, so nothing else changes.
import { settings } from "$lib/stores/settings.svelte";

type Mermaid = typeof import("mermaid").default;

let seq = 0;
let loading: Promise<Mermaid> | null = null;
let initedTheme: string | null = null;

function load(): Promise<Mermaid> {
  loading ??= import("mermaid").then((m) => m.default);
  return loading;
}

/** Start loading Mermaid without rendering anything (idle prewarm). */
export const preloadMermaid = load;

/** Render Mermaid `code` to an SVG string, themed to match the app. Throws on
 *  invalid diagrams so callers can show their own error UI. */
export async function renderMermaidSvg(code: string): Promise<string> {
  const mermaid = await load();
  const theme = settings.resolvedTheme === "dark" ? "dark" : "default";
  // initialize() is a full config rebuild; only redo it when the theme changed.
  if (initedTheme !== theme) {
    mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict" });
    initedTheme = theme;
  }
  const { svg } = await mermaid.render(`mmd-${seq++}`, code);
  return svg;
}
