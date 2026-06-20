<script lang="ts">
  import MenuBar from "$lib/components/MenuBar.svelte";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import TabBar from "$lib/components/TabBar.svelte";
  import TabView from "$lib/components/TabView.svelte";
  import StatusBar from "$lib/components/StatusBar.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import UpdateBanner from "$lib/components/UpdateBanner.svelte";
  import AssocBanner from "$lib/components/AssocBanner.svelte";
  import Outline from "$lib/components/Outline.svelte";
  import SettingsDialog from "$lib/components/SettingsDialog.svelte";
  import AboutDialog from "$lib/components/AboutDialog.svelte";
  import ChangelogDialog from "$lib/components/ChangelogDialog.svelte";
  import GoToLineDialog from "$lib/components/GoToLineDialog.svelte";
  import CommandPalette from "$lib/components/CommandPalette.svelte";
  import EmojiPicker from "$lib/components/EmojiPicker.svelte";
  import Toasts from "$lib/components/Toasts.svelte";
  import { tabs, isDirty, tabTitle } from "$lib/stores/tabs.svelte";
  import { recent } from "$lib/stores/recent.svelte";
  import { settings, type ViewMode } from "$lib/stores/settings.svelte";
  import { updater } from "$lib/stores/updater.svelte";
  import { editorCommands, formatCommands, insertToc, formatDocument } from "$lib/editor-commands";
  import { exportHtml, exportPdf, copyAsHtml } from "$lib/export";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  let settingsOpen = $state(false);
  let aboutOpen = $state(false);
  let changelogOpen = $state(false);
  let gotoOpen = $state(false);
  let paletteOpen = $state(false);
  let emojiOpen = $state(false);
  let outlineVisible = $state(false);

  // Keep the OS window title in sync with the active tab (name + dirty marker).
  $effect(() => {
    const t = tabs.active;
    const title = t ? `${isDirty(t) ? "● " : ""}${tabTitle(t)} — mdedit` : "mdedit";
    getCurrentWindow()
      .setTitle(title)
      .catch(() => {}); // not under Tauri
  });

  // Autosave: when enabled, save the active path-backed tab after the user stops
  // typing for the configured delay. Editing resets the timer (debounce).
  $effect(() => {
    const tab = tabs.active;
    const content = tab?.content; // tracked so edits re-run the effect
    if (!settings.autosave || !tab || !tab.path || content === tab.savedContent) return;
    const timer = setTimeout(() => void tabs.save(tab.id), settings.autosaveDelayMs);
    return () => clearTimeout(timer);
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
    paste_as_markdown: () => void editorCommands.pasteAsMarkdown(),
    select_all: () => editorCommands.selectAll(),
    insert_table: () => formatCommands.table(),
    insert_toc: () => insertToc(),
    format_tables: () => formatCommands.formatTables(),
    format_document: () => formatDocument(),
    goto_line: () => (gotoOpen = true),
    insert_emoji: () => (emojiOpen = true),
    clear_recent: () => void recent.clearRecent(),
    view_source: () => setViewMode("source"),
    view_split: () => setViewMode("split"),
    view_preview: () => setViewMode("preview"),
    view_live: () => setViewMode("live"),
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

    // Editor font zoom: Ctrl with +/-/0 (main row or numpad).
    if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
      e.preventDefault();
      return void settings.setEditorFontSize(settings.editorFontSize + 1);
    }
    if (e.key === "-" || e.key === "_" || e.code === "NumpadSubtract") {
      e.preventDefault();
      return void settings.setEditorFontSize(settings.editorFontSize - 1);
    }
    if (e.key === "0" || e.code === "Numpad0") {
      e.preventDefault();
      return void settings.setEditorFontSize(14);
    }

    if (key === "p" && e.shiftKey) {
      e.preventDefault();
      paletteOpen = true;
      return;
    }
    if (key === "v" && e.shiftKey) {
      e.preventDefault();
      return commands.paste_as_markdown();
    }

    let cmd: string | undefined;
    if (key === "s") cmd = e.altKey ? "save_all" : e.shiftKey ? "save_as" : "save";
    else if (key === "n") cmd = "new";
    else if (key === "o") cmd = "open";
    else if (key === "w") cmd = "close_tab";
    else if (key === "g") cmd = "goto_line";
    else if (key === "t" && e.shiftKey) cmd = "reopen_closed";
    else if (["1", "2", "3", "4"].includes(e.key))
      cmd = ["view_source", "view_split", "view_preview", "view_live"][Number(e.key) - 1];
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
  <MenuBar onCommand={handleMenu} {outlineVisible} />
  <Toolbar onOpenSettings={() => (settingsOpen = true)} />
  <UpdateBanner />
  <AssocBanner />
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
{#if gotoOpen}<GoToLineDialog onClose={() => (gotoOpen = false)} />{/if}
{#if paletteOpen}
  <CommandPalette
    onRun={(id) => {
      paletteOpen = false;
      handleMenu(id);
    }}
    onClose={() => (paletteOpen = false)}
  />
{/if}
{#if emojiOpen}<EmojiPicker onClose={() => (emojiOpen = false)} />{/if}
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
