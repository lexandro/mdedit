<script lang="ts">
  import MenuBar from "$lib/components/MenuBar.svelte";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import TabBar from "$lib/components/TabBar.svelte";
  import TabView from "$lib/components/TabView.svelte";
  import SettingsDialog from "$lib/components/SettingsDialog.svelte";
  import { tabs, isDirty, tabTitle, basename } from "$lib/stores/tabs.svelte";
  import { recent } from "$lib/stores/recent.svelte";
  import { settings, type ViewMode } from "$lib/stores/settings.svelte";
  import { updater } from "$lib/stores/updater.svelte";
  import { editorStatus } from "$lib/stores/editor-status.svelte";
  import { editorCommands, formatCommands } from "$lib/editor-commands";
  import { exportHtml, exportPdf, copyAsHtml } from "$lib/export";
  import UpdateBanner from "$lib/components/UpdateBanner.svelte";
  import Outline from "$lib/components/Outline.svelte";
  import AboutDialog from "$lib/components/AboutDialog.svelte";
  import ChangelogDialog from "$lib/components/ChangelogDialog.svelte";
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

  // Single source of truth for actions dispatchable from the menu and keyboard.
  const commands: Record<string, () => void> = {
    new: () => tabs.newTab(),
    open: () => void tabs.open(),
    save: () => void tabs.save(),
    save_as: () => void tabs.saveAs(),
    save_all: () => void tabs.saveAll(),
    close_tab: () => {
      if (tabs.activeId != null) void tabs.closeWithConfirm(tabs.activeId);
    },
    reopen_closed: () => tabs.reopenClosed(),
    quit: () => void getCurrentWindow().close(),
    export_html: () => {
      const t = tabs.active;
      if (t) void exportHtml(t.content, tabTitle(t).replace(/\.[^.]+$/, ""));
    },
    export_pdf: () => {
      const t = tabs.active;
      if (t) exportPdf(t.content, t.path, tabTitle(t).replace(/\.[^.]+$/, ""));
    },
    undo: () => editorCommands.undo(),
    redo: () => editorCommands.redo(),
    cut: () => editorCommands.cut(),
    copy: () => editorCommands.copy(),
    paste: () => void editorCommands.paste(),
    select_all: () => editorCommands.selectAll(),
    insert_table: () => formatCommands.table(),
    format_tables: () => formatCommands.formatTables(),
    copy_html: () => {
      if (tabs.active) void copyAsHtml(tabs.active.content);
    },
    view_source: () => setViewMode("source"),
    view_split: () => setViewMode("split"),
    view_preview: () => setViewMode("preview"),
    toggle_orientation: () =>
      settings.setSplitOrientation(
        settings.splitOrientation === "vertical" ? "horizontal" : "vertical",
      ),
    settings: () => (settingsOpen = true),
    toggle_outline: () => (outlineVisible = !outlineVisible),
    toggle_word_wrap: () => settings.setWordWrap(!settings.wordWrap),
    check_updates: () => void updater.check(true),
    changelog: () => (changelogOpen = true),
    about: () => (aboutOpen = true),
  };

  function handleMenu(id: string) {
    if (id.startsWith("open_recent:")) {
      void tabs.openPath(id.slice("open_recent:".length));
      return;
    }
    commands[id]?.();
  }

  function toggleLineEnding() {
    if (!tabs.active) return;
    tabs.setLineEnding(tabs.active.id, tabs.active.lineEnding === "lf" ? "crlf" : "lf");
  }

  // Status-bar metrics for the active document.
  let wordCount = $derived.by(() => {
    const text = tabs.active?.content.trim() ?? "";
    return text ? text.split(/\s+/).length : 0;
  });
  let charCount = $derived(tabs.active?.content.length ?? 0);
  let readMinutes = $derived(Math.max(1, Math.ceil(wordCount / 200)));

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
    const next = (idx + dir + tabs.tabs.length) % tabs.tabs.length;
    tabs.select(tabs.tabs[next].id);
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
        <div class="empty">
          <img class="logo" src="/app-icon.png" alt="mdedit logo" width="96" height="96" />
          <h1>mdedit</h1>
          <p>No file open.</p>
          <div class="empty-actions">
            <button onclick={() => tabs.newTab()}>New file</button>
            <button onclick={() => tabs.open()}>Open file…</button>
          </div>
          {#if recent.paths.length > 0}
            <div class="recent">
              <h2>Recent</h2>
              <ul>
                {#each recent.paths as path (path)}
                  <li>
                    <button class="recent-item" title={path} onclick={() => tabs.openPath(path)}>
                      {basename(path)}<span class="path">{path}</span>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
          <p class="hint">Ctrl+N new · Ctrl+O open · Ctrl+S save · Ctrl+1/2/3 view mode</p>
        </div>
      {:else}
        {#each tabs.tabs as tab (tab.id)}
          <div class="tab-host" style:display={tab.id === tabs.activeId ? "block" : "none"}>
            <TabView {tab} />
          </div>
        {/each}
      {/if}
    </div>
  </main>

  <footer class="statusbar">
    {#if tabs.active}
      <span>{isDirty(tabs.active) ? "● Modified" : "Saved"}</span>
      <button class="status-btn" title="Toggle line ending" onclick={toggleLineEnding}>
        {tabs.active.lineEnding.toUpperCase()}
      </button>
      <span>{tabs.active.hadBom ? "UTF-8 BOM" : "UTF-8"}</span>
      <span class="spacer"></span>
      <span>Ln {editorStatus.line}, Col {editorStatus.col}</span>
      <span>{wordCount} words</span>
      <span>{charCount} chars</span>
      <span>~{readMinutes} min read</span>
    {:else}
      <span class="spacer"></span>
    {/if}
  </footer>
</div>

{#if settingsOpen}
  <SettingsDialog onClose={() => (settingsOpen = false)} />
{/if}

{#if aboutOpen}
  <AboutDialog onClose={() => (aboutOpen = false)} />
{/if}

{#if changelogOpen}
  <ChangelogDialog onClose={() => (changelogOpen = false)} />
{/if}

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
  .empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--fg-muted);
  }
  .empty .logo {
    image-rendering: auto;
    opacity: 0.95;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  }
  .empty h1 {
    margin: 0;
    color: var(--fg);
  }
  .empty-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }
  .empty-actions button {
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
  }
  .empty-actions button:hover {
    border-color: var(--accent);
  }
  .hint {
    font-size: 12px;
    margin-top: 12px;
  }
  .recent {
    margin-top: 18px;
    width: min(460px, 80vw);
  }
  .recent h2 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted);
    margin: 0 0 6px;
  }
  .recent ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .recent-item {
    display: flex;
    align-items: baseline;
    gap: 10px;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--fg);
    padding: 5px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .recent-item:hover {
    background: var(--bg-alt);
  }
  .recent-item .path {
    color: var(--fg-muted);
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .statusbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 3px 12px;
    font-size: 12px;
    color: var(--fg-muted);
    background: var(--bg-alt);
    border-top: 1px solid var(--border);
  }
  .spacer {
    flex: 1;
  }
  .status-btn {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font: inherit;
    padding: 0 4px;
    border-radius: 4px;
    cursor: pointer;
  }
  .status-btn:hover {
    background: var(--border);
    color: var(--fg);
  }
</style>
