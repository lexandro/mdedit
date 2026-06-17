<script lang="ts">
  import { tabs } from "$lib/stores/tabs.svelte";
  import { settings, type ViewMode } from "$lib/stores/settings.svelte";

  let { onOpenSettings }: { onOpenSettings: () => void } = $props();

  const viewModes: { id: ViewMode; label: string; icon: string }[] = [
    { id: "source", label: "Source", icon: "≣" },
    { id: "split", label: "Split", icon: "▥" },
    { id: "preview", label: "Preview", icon: "▦" },
  ];

  function setMode(mode: ViewMode) {
    if (tabs.active) tabs.setViewMode(tabs.active.id, mode);
  }

  function toggleOrientation() {
    settings.setSplitOrientation(
      settings.splitOrientation === "vertical" ? "horizontal" : "vertical",
    );
  }
</script>

<div class="toolbar">
  <div class="group">
    <button onclick={() => tabs.newTab()} title="New (Ctrl+N)">New</button>
    <button onclick={() => tabs.open()} title="Open (Ctrl+O)">Open</button>
    <button onclick={() => tabs.save()} disabled={!tabs.active} title="Save (Ctrl+S)">Save</button>
    <button onclick={() => tabs.saveAs()} disabled={!tabs.active} title="Save As (Ctrl+Shift+S)">
      Save As
    </button>
  </div>

  <div class="group modes" role="group" aria-label="View mode">
    {#each viewModes as m (m.id)}
      <button
        class:active={tabs.active?.viewMode === m.id}
        disabled={!tabs.active}
        title={m.label}
        onclick={() => setMode(m.id)}
      >
        <span aria-hidden="true">{m.icon}</span> {m.label}
      </button>
    {/each}
    {#if tabs.active?.viewMode === "split"}
      <button onclick={toggleOrientation} title="Toggle split orientation">
        {settings.splitOrientation === "vertical" ? "⇆" : "⇅"}
      </button>
    {/if}
  </div>

  <div class="group right">
    <button onclick={onOpenSettings} title="Settings">⚙</button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 4px 8px;
    background: var(--bg-alt);
    border-bottom: 1px solid var(--border);
  }
  .group {
    display: flex;
    gap: 4px;
  }
  .right {
    margin-left: auto;
  }
  button {
    border: 1px solid transparent;
    background: transparent;
    color: var(--fg);
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  button:hover:not(:disabled) {
    background: var(--border);
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .modes button.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
</style>
