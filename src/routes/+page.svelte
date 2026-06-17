<script lang="ts">
  import Toolbar from "$lib/components/Toolbar.svelte";
  import TabBar from "$lib/components/TabBar.svelte";
  import TabView from "$lib/components/TabView.svelte";
  import SettingsDialog from "$lib/components/SettingsDialog.svelte";
  import { tabs, isDirty } from "$lib/stores/tabs.svelte";

  let settingsOpen = $state(false);

  // Status-bar metrics for the active document.
  let wordCount = $derived.by(() => {
    const text = tabs.active?.content.trim() ?? "";
    return text ? text.split(/\s+/).length : 0;
  });
  let charCount = $derived(tabs.active?.content.length ?? 0);

  function onKeydown(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    const key = e.key.toLowerCase();

    if (key === "n") {
      e.preventDefault();
      tabs.newTab();
    } else if (key === "o") {
      e.preventDefault();
      void tabs.open();
    } else if (key === "s") {
      e.preventDefault();
      if (e.shiftKey) void tabs.saveAs();
      else void tabs.save();
    } else if (key === "w") {
      e.preventDefault();
      if (tabs.activeId != null) void tabs.closeWithConfirm(tabs.activeId);
    } else if (e.key === "Tab") {
      e.preventDefault();
      cycleTab(e.shiftKey ? -1 : 1);
    } else if (["1", "2", "3"].includes(e.key) && tabs.active) {
      e.preventDefault();
      const mode = (["source", "split", "preview"] as const)[Number(e.key) - 1];
      tabs.setViewMode(tabs.active.id, mode);
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
  <Toolbar onOpenSettings={() => (settingsOpen = true)} />
  <TabBar />

  <main class="workspace">
    {#if tabs.tabs.length === 0}
      <div class="empty">
        <h1>mdedit</h1>
        <p>No file open.</p>
        <div class="empty-actions">
          <button onclick={() => tabs.newTab()}>New file</button>
          <button onclick={() => tabs.open()}>Open file…</button>
        </div>
        <p class="hint">Ctrl+N new · Ctrl+O open · Ctrl+S save · Ctrl+1/2/3 view mode</p>
      </div>
    {:else}
      {#each tabs.tabs as tab (tab.id)}
        <div class="tab-host" style:display={tab.id === tabs.activeId ? "block" : "none"}>
          <TabView {tab} />
        </div>
      {/each}
    {/if}
  </main>

  <footer class="statusbar">
    {#if tabs.active}
      <span>{isDirty(tabs.active) ? "● Modified" : "Saved"}</span>
      <span>{tabs.active.lineEnding.toUpperCase()}</span>
      <span>{tabs.active.hadBom ? "UTF-8 BOM" : "UTF-8"}</span>
      <span class="spacer"></span>
      <span>{wordCount} words</span>
      <span>{charCount} chars</span>
    {:else}
      <span class="spacer"></span>
    {/if}
  </footer>
</div>

{#if settingsOpen}
  <SettingsDialog onClose={() => (settingsOpen = false)} />
{/if}

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .workspace {
    flex: 1;
    position: relative;
    overflow: hidden;
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
</style>
