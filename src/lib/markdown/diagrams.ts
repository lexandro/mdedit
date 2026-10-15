// Turn the `<pre class="mermaid">` blocks renderMarkdown emits into inline SVG,
// for documents that leave the app (print, export) and so can't run Mermaid
// themselves. The renderer is a parameter, which keeps this module free of the
// Mermaid and settings imports and testable with a fake.

export type DiagramRenderer = (code: string) => Promise<string>;

export interface DiagramCounts {
  rendered: number;
  failed: number;
}

export async function renderDiagramsIn(
  root: ParentNode,
  render: DiagramRenderer,
): Promise<DiagramCounts> {
  let rendered = 0;
  let failed = 0;
  // Sequential on purpose: mermaid.render() rebuilds a global config and hangs a
  // temporary measuring node off document.body, so parallel calls interleave.
  for (const host of [...root.querySelectorAll<HTMLElement>("pre.mermaid")]) {
    // textContent, not innerHTML: the fence rule escaped the source, and Mermaid
    // needs `A --> B` back, not `A --&gt; B`.
    const code = (host.textContent ?? "").trim();
    if (!code) continue;
    try {
      const svg = await render(code);
      const wrap = host.ownerDocument.createElement("div");
      wrap.className = "mermaid-svg";
      // Markup, like the live preview does: Mermaid renders with securityLevel
      // "strict", so this is the same trust level as the on-screen diagram.
      wrap.innerHTML = svg;
      host.replaceWith(wrap);
      rendered++;
    } catch {
      // Leave the <pre> alone — a readable diagram source beats a hole in the
      // document. The caller reports the count.
      failed++;
    }
  }
  return { rendered, failed };
}
