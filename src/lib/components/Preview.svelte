<script lang="ts">
  import { renderMarkdown } from "$lib/markdown/renderer";
  import { settings } from "$lib/stores/settings.svelte";
  import mermaid from "mermaid";

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
  let mermaidSeq = 0;

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

  // Toggle the n-th GFM task item (0-based) in the source, matching the order
  // of rendered checkboxes. Skips fenced code so task syntax there doesn't count.
  function toggleTaskInSource(src: string, n: number, checked: boolean): string {
    const lines = src.split("\n");
    let count = -1;
    let fence: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      const fm = lines[i].match(/^\s*(```+|~~~+)/);
      if (fm) {
        const mk = fm[1][0];
        if (fence === null) fence = mk;
        else if (lines[i].trim().startsWith(fence)) fence = null;
        continue;
      }
      if (fence !== null) continue;
      const m = lines[i].match(/^(\s*(?:[-*+]|\d+\.)\s+\[)[ xX](\].*)$/);
      if (m && ++count === n) {
        lines[i] = m[1] + (checked ? "x" : " ") + m[2];
        break;
      }
    }
    return lines.join("\n");
  }

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
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "strict",
    });
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
