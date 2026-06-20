<script lang="ts">
  import { renderMarkdown } from "$lib/markdown/renderer";
  import { renderMermaidSvg } from "$lib/markdown/mermaid";
  import { toggleTaskInSource } from "$lib/md-tasks";
  import { settings } from "$lib/stores/settings.svelte";

  let {
    source,
    basePath,
    scrollFraction,
    onScroll,
    onSourceChange,
  }: {
    source: string;
    basePath?: string | null;
    scrollFraction?: number;
    onScroll?: (fraction: number) => void;
    onSourceChange?: (newSource: string) => void;
  } = $props();

  let container: HTMLDivElement;

  // Re-render is debounced (configurable) so fast typing in big documents stays
  // smooth. The first render and delay <= 0 are immediate.
  let html = $state("");
  let firstRender = true;
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const s = source;
    const bp = basePath;
    const delay = settings.previewDebounceMs;
    if (firstRender || delay <= 0) {
      firstRender = false;
      html = renderMarkdown(s, bp);
      return;
    }
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => (html = renderMarkdown(s, bp)), delay);
    return () => clearTimeout(renderTimer);
  });

  // A task checkbox was toggled in the preview — reflect it in the source.
  function onContainerChange(e: Event) {
    const target = e.target as HTMLElement;
    if (!onSourceChange || !(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
    const boxes = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    const idx = boxes.indexOf(target);
    if (idx >= 0) onSourceChange(toggleTaskInSource(source, idx, target.checked));
  }

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
    const nodes = container.querySelectorAll<HTMLElement>("pre.mermaid:not([data-rendered])");
    if (nodes.length === 0) return; // skip mermaid entirely for docs without diagrams
    void theme; // re-run when the theme flips
    const run = async () => {
      for (const node of Array.from(nodes)) {
        const code = node.textContent ?? "";
        node.setAttribute("data-rendered", "1");
        try {
          node.innerHTML = await renderMermaidSvg(code);
          node.classList.add("mermaid-rendered");
        } catch (e) {
          node.textContent = `Mermaid error: ${(e as Error).message}`;
        }
      }
    };
    void run();
  });
</script>

<div
  class="preview markdown-body"
  bind:this={container}
  onscroll={handleScroll}
  onchange={onContainerChange}
>
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
