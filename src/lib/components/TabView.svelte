<script lang="ts">
  import Editor from "$lib/components/Editor.svelte";
  import Preview from "$lib/components/Preview.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import type { Tab } from "$lib/stores/tabs.svelte";

  let { tab }: { tab: Tab } = $props();

  // Editor + Preview stay mounted across view-mode changes (CSS toggles them),
  // so switching source <-> split <-> preview never loses cursor/undo history.
  let percent = $state(50);
  let dragging = $state(false);
  let root: HTMLDivElement;
  let scrollFraction = $state<number | undefined>(undefined);

  let orientation = $derived(settings.splitOrientation);

  // Only mirror scrolling when both panes are visible.
  function onEditorScroll(f: number) {
    if (tab.viewMode === "split") scrollFraction = f;
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging || !root) return;
    const rect = root.getBoundingClientRect();
    const ratio =
      orientation === "vertical"
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height;
    percent = Math.min(85, Math.max(15, ratio * 100));
  }
  function onPointerUp(e: PointerEvent) {
    dragging = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }
</script>

<div
  class="tabview mode-{tab.viewMode} {orientation}"
  class:dragging
  bind:this={root}
  style="--first: {percent}%"
>
  <div class="pane editor-pane">
    <Editor {tab} onScroll={onEditorScroll} />
  </div>
  <div
    class="divider"
    role="separator"
    tabindex="-1"
    aria-orientation={orientation === "vertical" ? "vertical" : "horizontal"}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
  ></div>
  <div class="pane preview-pane">
    <Preview source={tab.content} {scrollFraction} />
  </div>
</div>

<style>
  .tabview {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  .tabview.vertical {
    flex-direction: row;
  }
  .tabview.horizontal {
    flex-direction: column;
  }
  .pane {
    overflow: hidden;
    min-width: 0;
    min-height: 0;
  }

  /* --- source only --- */
  .mode-source .editor-pane {
    flex: 1;
  }
  .mode-source .preview-pane,
  .mode-source .divider {
    display: none;
  }

  /* --- preview only --- */
  .mode-preview .preview-pane {
    flex: 1;
  }
  .mode-preview .editor-pane,
  .mode-preview .divider {
    display: none;
  }

  /* --- split --- */
  .mode-split.vertical .editor-pane {
    width: var(--first);
  }
  .mode-split.vertical .preview-pane {
    width: calc(100% - var(--first));
  }
  .mode-split.horizontal .editor-pane {
    height: var(--first);
  }
  .mode-split.horizontal .preview-pane {
    height: calc(100% - var(--first));
  }

  .mode-split .divider {
    flex: 0 0 6px;
    background: var(--border);
    transition: background 0.15s;
  }
  .mode-split.vertical .divider {
    cursor: col-resize;
  }
  .mode-split.horizontal .divider {
    cursor: row-resize;
  }
  .mode-split .divider:hover,
  .mode-split.dragging .divider {
    background: var(--accent);
  }
</style>
