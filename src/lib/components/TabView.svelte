<script lang="ts">
  import Editor from "$lib/components/Editor.svelte";
  import Preview from "$lib/components/Preview.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { tabs, type Tab } from "$lib/stores/tabs.svelte";

  let { tab }: { tab: Tab } = $props();

  // The Editor stays mounted across view-mode changes (CSS toggles it), so
  // switching source <-> split <-> preview never loses cursor/undo history. The
  // Preview is mounted only when it is actually on screen — a background tab's
  // rendered preview costs ~290 MB for a 1 MB document and nobody can see it.
  let percent = $state(50);
  let dragging = $state(false);
  let root: HTMLDivElement;
  // Each pane drives the other; the receiving pane suppresses its echo.
  let editorFraction = $state<number | undefined>(undefined);
  let previewFraction = $state<number | undefined>(undefined);

  let orientation = $derived(settings.splitOrientation);

  // Mirror scrolling in both directions, but only while both panes are visible.
  function onEditorScroll(f: number) {
    if (tab.viewMode === "split") previewFraction = f;
  }
  function onPreviewScroll(f: number) {
    if (tab.viewMode === "split") editorFraction = f;
    // Remembered here rather than in Preview, which unmounts with the tab;
    // re-applying the position it already holds is a no-op.
    previewFraction = f;
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
    <Editor
      {tab}
      live={tab.viewMode === "live"}
      onScroll={onEditorScroll}
      scrollFraction={editorFraction}
    />
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
    {#if (tab.viewMode === "split" || tab.viewMode === "preview") && tab.id === tabs.activeId}
      <Preview
        source={tab.content}
        basePath={tab.path}
        scrollFraction={previewFraction}
        onScroll={onPreviewScroll}
        onSourceChange={(s) => tabs.setContent(tab.id, s)}
      />
    {/if}
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

  /* --- source / live (editor fills, no preview pane) --- */
  .mode-source .editor-pane,
  .mode-live .editor-pane {
    flex: 1;
  }
  .mode-source .preview-pane,
  .mode-source .divider,
  .mode-live .preview-pane,
  .mode-live .divider {
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
