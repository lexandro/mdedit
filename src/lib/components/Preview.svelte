<script lang="ts">
  import { renderMarkdown } from "$lib/markdown/renderer";
  import { settings } from "$lib/stores/settings.svelte";
  import mermaid from "mermaid";

  let {
    source,
    scrollFraction,
    onScroll,
  }: {
    source: string;
    scrollFraction?: number;
    onScroll?: (fraction: number) => void;
  } = $props();

  let container: HTMLDivElement;
  let html = $derived(renderMarkdown(source));
  let mermaidSeq = 0;

  // Last fraction we programmatically applied, to suppress the echo scroll event.
  let appliedFraction = -1;

  // Follow the editor's scroll position (driven from a split view).
  $effect(() => {
    const f = scrollFraction;
    if (!container || f == null) return;
    const max = container.scrollHeight - container.clientHeight;
    if (max <= 0) return;
    appliedFraction = f;
    container.scrollTop = f * max;
  });

  function handleScroll() {
    if (!container || !onScroll) return;
    const max = container.scrollHeight - container.clientHeight;
    const cur = max > 0 ? container.scrollTop / max : 0;
    if (Math.abs(cur - appliedFraction) < 0.004) return; // echo from sync
    onScroll(cur);
  }

  // (Re)render after the HTML is in the DOM and whenever the theme flips.
  $effect(() => {
    const _ = html;
    const theme = settings.resolvedTheme;
    if (!container) return;
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "strict",
    });
    const nodes = container.querySelectorAll<HTMLElement>("pre.mermaid:not([data-rendered])");
    if (nodes.length === 0) return;
    const run = async () => {
      for (const node of Array.from(nodes)) {
        const code = node.textContent ?? "";
        node.setAttribute("data-rendered", "1");
        try {
          const { svg } = await mermaid.render(`mmd-${mermaidSeq++}`, code);
          node.innerHTML = svg;
          node.classList.add("mermaid-rendered");
        } catch (e) {
          node.textContent = `Mermaid error: ${(e as Error).message}`;
        }
      }
    };
    void run();
  });
</script>

<div class="preview markdown-body" bind:this={container} onscroll={handleScroll}>
  {@html html}
</div>

<style>
  .preview {
    height: 100%;
    overflow: auto;
    padding: 1.5rem 2rem;
    line-height: 1.6;
    color: var(--fg);
    background: var(--bg);
  }
</style>
