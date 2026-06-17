<script lang="ts">
  import { tabs } from "$lib/stores/tabs.svelte";
  import { settings, type ViewMode } from "$lib/stores/settings.svelte";
  import { formatCommands } from "$lib/editor-commands";
  import Icon, { type IconName } from "$lib/components/Icon.svelte";

  let { onOpenSettings }: { onOpenSettings: () => void } = $props();

  const viewModes: { id: ViewMode; label: string; icon: IconName }[] = [
    { id: "source", label: "Source", icon: "source" },
    { id: "split", label: "Split", icon: "split" },
    { id: "preview", label: "Preview", icon: "preview" },
  ];

  const formats: { icon: IconName; title: string; run: () => void }[] = [
    { icon: "bold", title: "Bold (Ctrl+B)", run: formatCommands.bold },
    { icon: "italic", title: "Italic (Ctrl+I)", run: formatCommands.italic },
    { icon: "code", title: "Inline code", run: formatCommands.code },
    { icon: "link", title: "Link (Ctrl+K)", run: formatCommands.link },
    { icon: "heading", title: "Heading", run: formatCommands.heading },
    { icon: "list", title: "Bulleted list", run: formatCommands.bullet },
    { icon: "quote", title: "Quote", run: formatCommands.quote },
    { icon: "table", title: "Insert table", run: formatCommands.table },
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

  <div class="group format" role="group" aria-label="Formatting">
    {#each formats as f (f.icon)}
      <button class="icon-only" disabled={!tabs.active} title={f.title} aria-label={f.title} onclick={f.run}>
        <Icon name={f.icon} />
      </button>
    {/each}
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
