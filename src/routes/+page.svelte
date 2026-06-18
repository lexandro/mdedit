<script lang="ts">
  import MenuBar from "$lib/components/MenuBar.svelte";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import TabBar from "$lib/components/TabBar.svelte";
  import TabView from "$lib/components/TabView.svelte";
  import StatusBar from "$lib/components/StatusBar.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import UpdateBanner from "$lib/components/UpdateBanner.svelte";
  import Outline from "$lib/components/Outline.svelte";
  import SettingsDialog from "$lib/components/SettingsDialog.svelte";
  import AboutDialog from "$lib/components/AboutDialog.svelte";
  import ChangelogDialog from "$lib/components/ChangelogDialog.svelte";
  import Toasts from "$lib/components/Toasts.svelte";
  import { tabs, isDirty, tabTitle } from "$lib/stores/tabs.svelte";
  import { settings, type ViewMode } from "$lib/stores/settings.svelte";
  import { updater } from "$lib/stores/updater.svelte";
  import { editorCommands, formatCommands } from "$lib/editor-commands";
  import { exportHtml, exportPdf, copyAsHtml } from "$lib/export";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  let settingsOpen = $state(false);
  let aboutOpen = $state(false);
  let changelogOpen = $state(false);
  let outlineVisible = $state(false);

  // Keep the OS window title in sync with the active tab (name + dirty marker).
  $effect(() => {
    const t = tabs.active;
    const title = t ? `${isDirty(t) ? "● " : ""}${tabTitle(t)} — mdedit` : "mdedit";
    getCurrentWindow()
      .setTitle(title)
      .catch(() => {}); // not under Tauri
  });

  function setViewMode(mode: ViewMode) {
    if (tabs.active) tabs.setViewMode(tabs.active.id, mode);
  }
  const docTitle = () => (tabs.active ? tabTitle(tabs.active).replace(/\.[^.]+$/, "") : "");

  // Single source of truth for actions dispatchable from the menu and keyboard.
  const commands: Record<string, () => void> = {
    new: () => tabs.newTab(),
    open: () => void tabs.open(),
    save: () => void tabs.save(),
    save_as: () => void tabs.saveAs(),
    save_all: () => void tabs.saveAll(),
    close_tab: () => tabs.activeId != null && void tabs.closeWithConfirm(tabs.activeId),
    reopen_closed: () => tabs.reopenClosed(),
    quit: () => void getCurrentWindow().close(),
    export_html: () => void (tabs.active && exportHtml(tabs.active.content, docTitle())),
    export_pdf: () => tabs.active && exportPdf(tabs.active.content, tabs.active.path, docTitle()),
    copy_html: () => void (tabs.active && copyAsHtml(tabs.active.content)),
    undo: () => editorCommands.undo(),
    redo: () => editorCommands.redo(),
    cut: () => editorCommands.cut(),
    copy: () => editorCommands.copy(),
    paste: () => void editorCommands.paste(),
    select_all: () => editorCommands.selectAll(),
    insert_table: () => formatCommands.table(),
    format_tables: () => formatCommands.formatTables(),
    view_source: () => setViewMode("source"),
    view_split: () => setViewMode("split"),
    view_preview: () => setViewMode("preview"),
    toggle_orientation: () =>
      settings.setSplitOrientation(
        settings.splitOrientation === "vertical" ? "horizontal" : "vertical",
      ),
    toggle_outline: () => (outlineVisible = !outlineVisible),
    toggle_word_wrap: () => settings.setWordWrap(!settings.wordWrap),
    settings: () => (settingsOpen = true),
    check_updates: () => void updater.check(true),
    changelog: () => (changelogOpen = true),
    about: () => (aboutOpen = true),
  };

  function handleMenu(id: string) {
    if (id.startsWith("open_recent:")) void tabs.openPath(id.slice("open_recent:".length));
    else commands[id]?.();
  }

  // Keystroke -> command id. Tab cycling is keyboard-only (not a menu command).
  function onKeydown(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();

    let cmd: string | undefined;
    if (key === "s") cmd = e.altKey ? "save_all" : e.shiftKey ? "save_as" : "save";
    else if (key === "n") cmd = "new";
    else if (key === "o") cmd = "open";
    else if (key === "w") cmd = "close_tab";
    else if (key === "t" && e.shiftKey) cmd = "reopen_closed";
    else if (["1", "2", "3"].includes(e.key))
      cmd = ["view_source", "view_split", "view_preview"][Number(e.key) - 1];
    else if (e.key === "Tab") {
      e.preventDefault();
      cycleTab(e.shiftKey ? -1 : 1);
      return;
    }
    if (cmd) {
      e.preventDefault();
      commands[cmd]();
    }
  }

  function cycleTab(dir: number) {
    if (tabs.tabs.length === 0) return;
    const idx = tabs.tabs.findIndex((t) => t.id === tabs.activeId);
    tabs.select(tabs.tabs[(idx + dir + tabs.tabs.length) % tabs.tabs.length].id);
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app">
  <MenuBar onCommand={handleMenu} />
  <Toolbar onOpenSettings={() => (settingsOpen = true)} />
  <UpdateBanner />
  <TabBar />

  <main class="workspace">
    {#if outlineVisible && tabs.active}
      <Outline content={tabs.active.content} />
    {/if}
    <div class="tab-area">
      {#if tabs.tabs.length === 0}
        <EmptyState />
      {:else}
        {#each tabs.tabs as tab (tab.id)}
          <div class="tab-host" style:display={tab.id === tabs.activeId ? "block" : "none"}>
            <TabView {tab} />
          </div>
        {/each}
      {/if}
    </div>
  </main>

  <StatusBar />
</div>

{#if settingsOpen}<SettingsDialog onClose={() => (settingsOpen = false)} />{/if}
{#if aboutOpen}<AboutDialog onClose={() => (aboutOpen = false)} />{/if}
{#if changelogOpen}<ChangelogDialog onClose={() => (changelogOpen = false)} />{/if}
<Toasts />

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .workspace {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  .tab-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-width: 0;
  }
  .tab-host {
    position: absolute;
    inset: 0;
  }
</style>
