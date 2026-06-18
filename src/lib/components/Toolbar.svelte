<script lang="ts">
  import { tabs } from "$lib/stores/tabs.svelte";
  import { settings, type ViewMode } from "$lib/stores/settings.svelte";
  import { formatCommands } from "$lib/editor-commands";
  import Icon, { type IconName } from "$lib/components/Icon.svelte";
  import { t } from "$lib/i18n";

  let { onOpenSettings }: { onOpenSettings: () => void } = $props();

  const viewModes: { id: ViewMode; key: string; icon: IconName }[] = [
    { id: "source", key: "view.source", icon: "source" },
    { id: "split", key: "view.split", icon: "split" },
    { id: "preview", key: "view.preview", icon: "preview" },
  ];

  const formats: { icon: IconName; tip: string; run: () => void }[] = [
    { icon: "bold", tip: "tip.bold", run: formatCommands.bold },
    { icon: "italic", tip: "tip.italic", run: formatCommands.italic },
    { icon: "code", tip: "tip.code", run: formatCommands.code },
    { icon: "link", tip: "tip.link", run: formatCommands.link },
    { icon: "heading", tip: "tip.heading", run: formatCommands.heading },
    { icon: "list", tip: "tip.bullet", run: formatCommands.bullet },
    { icon: "quote", tip: "tip.quote", run: formatCommands.quote },
    { icon: "table", tip: "tip.table", run: formatCommands.table },
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
    <button onclick={() => tabs.newTab()} title={t("tip.new")}>
      <Icon name="new" /> {t("cmd.new")}
    </button>
    <button onclick={() => tabs.open()} title={t("tip.open")}>
      <Icon name="open" /> {t("cmd.open")}
    </button>
    <button onclick={() => tabs.save()} disabled={!tabs.active} title={t("tip.save")}>
      <Icon name="save" /> {t("cmd.save")}
    </button>
    <button onclick={() => tabs.saveAs()} disabled={!tabs.active} title={t("tip.save_as")}>
      <Icon name="save-as" /> {t("cmd.save_as")}
    </button>
  </div>

  <div class="group format" role="group" aria-label={t("tip.formatting")}>
    {#each formats as f (f.icon)}
      <button
        class="icon-only"
        disabled={!tabs.active}
        title={t(f.tip)}
        aria-label={t(f.tip)}
        onclick={f.run}
      >
        <Icon name={f.icon} />
      </button>
    {/each}
  </div>

  <div class="group modes" role="group" aria-label={t("tip.viewMode")}>
    {#each viewModes as m (m.id)}
      <button
        class:active={tabs.active?.viewMode === m.id}
        disabled={!tabs.active}
        title={t(m.key)}
        onclick={() => setMode(m.id)}
      >
        <Icon name={m.icon} /> {t(m.key)}
      </button>
    {/each}
    {#if tabs.active?.viewMode === "split"}
      <button
        class="icon-only"
        onclick={toggleOrientation}
        title={t("tip.toggle_orientation")}
        aria-label={t("tip.toggle_orientation")}
      >
        <Icon name={settings.splitOrientation === "vertical" ? "columns" : "rows"} />
      </button>
    {/if}
  </div>

  <div class="group right">
    <button class="icon-only" onclick={onOpenSettings} title={t("tip.settings")} aria-label={t("tip.settings")}>
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
