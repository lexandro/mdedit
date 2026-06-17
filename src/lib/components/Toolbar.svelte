<script lang="ts">
  import { tabs } from "$lib/stores/tabs.svelte";
  import { settings, type ViewMode } from "$lib/stores/settings.svelte";
  import Icon, { type IconName } from "$lib/components/Icon.svelte";

  let { onOpenSettings }: { onOpenSettings: () => void } = $props();

  const viewModes: { id: ViewMode; label: string; icon: IconName }[] = [
    { id: "source", label: "Source", icon: "source" },
    { id: "split", label: "Split", icon: "split" },
    { id: "preview", label: "Preview", icon: "preview" },
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
    <button onclick={() => tabs.newTab()} title="New (Ctrl+N)">
      <Icon name="new" /> New
    </button>
    <button onclick={() => tabs.open()} title="Open (Ctrl+O)">
      <Icon name="open" /> Open
    </button>
    <button onclick={() => tabs.save()} disabled={!tabs.active} title="Save (Ctrl+S)">
      <Icon name="save" /> Save
    </button>
    <button onclick={() => tabs.saveAs()} disabled={!tabs.active} title="Save As (Ctrl+Shift+S)">
      <Icon name="save-as" /> Save As
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
        <Icon name={m.icon} /> {m.label}
      </button>
    {/each}
    {#if tabs.active?.viewMode === "split"}
      <button
        class="icon-only"
        onclick={toggleOrientation}
        title="Toggle split orientation"
        aria-label="Toggle split orientation"
      >
        <Icon name={settings.splitOrientation === "vertical" ? "columns" : "rows"} />
      </button>
    {/if}
  </div>

  <div class="group right">
    <button class="icon-only" onclick={onOpenSettings} title="Settings" aria-label="Settings">
      <Icon name="settings" />
    </button>
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
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--fg);
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  button.icon-only {
    padding: 6px;
  }
  button :global(svg) {
    flex: 0 0 auto;
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
