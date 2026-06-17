<script lang="ts">
  import { renderMarkdown } from "$lib/markdown/renderer";
  import { settings } from "$lib/stores/settings.svelte";
  import mermaid from "mermaid";

  let { source }: { source: string } = $props();

  let container: HTMLDivElement;
  let html = $derived(renderMarkdown(source));
  let mermaidSeq = 0;

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

<div class="preview markdown-body" bind:this={container}>
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
