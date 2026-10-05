// Shared Mermaid rendering, used by the preview and the Live-mode editor widget.
// Mermaid (with cytoscape/dagre) is by far the heaviest dependency, and most
// documents contain no diagrams at all, so it is imported on first use. Both
// callers already await this function, so nothing else changes.
import { settings } from "$lib/stores/settings.svelte";
import { errorMessage } from "$lib/errors";

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

/** Mermaid's built-in theme that matches the app's resolved light/dark theme. */
function mermaidTheme(): "dark" | "default" {
  return settings.resolvedTheme === "dark" ? "dark" : "default";
}

/** Render Mermaid `code` to an SVG string, themed to match the app. Throws on
 *  invalid diagrams so callers can show their own error UI. */
export async function renderMermaidSvg(code: string): Promise<string> {
  const mermaid = await load();
  const theme = mermaidTheme();
  // initialize() is a full config rebuild; only redo it when the theme changed.
  if (initedTheme !== theme) {
    mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict" });
    initedTheme = theme;
  }
  const { svg } = await mermaid.render(`mmd-${seq++}`, code);
  return svg;
}

/** Draw `code` into `host`, doing nothing if that host already shows this diagram
 *  in the current theme. The source is kept on the element because the SVG
 *  replaces the host's text, so a later theme flip can still re-render it. */
export async function renderMermaidInto(host: HTMLElement, code: string): Promise<void> {
  const theme = mermaidTheme();
  if (host.dataset.mermaidCode === code && host.dataset.mermaidTheme === theme) return;
  // Stamped before the await so a concurrent pass (content *and* theme changed
  // in the same tick) skips instead of rendering the same diagram twice.
  host.dataset.mermaidCode = code;
  host.dataset.mermaidTheme = theme;
  try {
    host.innerHTML = await renderMermaidSvg(code);
  } catch (e) {
    host.textContent = `Mermaid error: ${errorMessage(e)}`;
  }
}

/** Re-render every Mermaid host under `root` that is still raw source or was
 *  drawn in another theme. Cheap to re-run: unchanged hosts are skipped. */
export async function refreshMermaidHosts(root: ParentNode, selector: string): Promise<void> {
  for (const host of root.querySelectorAll<HTMLElement>(selector)) {
    await renderMermaidInto(host, host.dataset.mermaidCode ?? host.textContent ?? "");
  }
}
