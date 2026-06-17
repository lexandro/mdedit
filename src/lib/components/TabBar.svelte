<script lang="ts">
  import { tabs, tabTitle, isDirty, type Tab } from "$lib/stores/tabs.svelte";

  function requestClose(tab: Tab, e: MouseEvent) {
    e.stopPropagation();
    void tabs.closeWithConfirm(tab.id);
  }
</script>

<div class="tabbar" role="tablist">
  {#each tabs.tabs as tab (tab.id)}
    <div
      class="tab"
      class:active={tab.id === tabs.activeId}
      role="tab"
      tabindex="0"
      aria-selected={tab.id === tabs.activeId}
      onclick={() => tabs.select(tab.id)}
      onkeydown={(e) => (e.key === "Enter" || e.key === " ") && tabs.select(tab.id)}
    >
      <span class="dot" class:dirty={isDirty(tab)} aria-hidden="true"></span>
      <span class="title">{tabTitle(tab)}</span>
      <button class="close" title="Close" onclick={(e) => requestClose(tab, e)}>×</button>
    </div>
  {/each}
  <button class="new-tab" title="New tab (Ctrl+N)" onclick={() => tabs.newTab()}>+</button>
</div>

<style>
  .tabbar {
    display: flex;
    align-items: stretch;
    background: var(--bg-alt);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
    min-height: 34px;
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px 0 12px;
    border-right: 1px solid var(--border);
    cursor: pointer;
    color: var(--fg-muted);
    white-space: nowrap;
    user-select: none;
  }
  .tab.active {
    background: var(--bg);
    color: var(--fg);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: transparent;
  }
  .dot.dirty {
    background: var(--accent);
  }
  .title {
    font-size: 13px;
  }
  .close {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    padding: 2px 5px;
    border-radius: 4px;
  }
  .close:hover {
    background: var(--border);
  }
  .new-tab {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    cursor: pointer;
    font-size: 18px;
    padding: 0 12px;
  }
  .new-tab:hover {
    color: var(--fg);
  }
</style>
