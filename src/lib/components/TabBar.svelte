<script lang="ts">
  import { tabs, tabTitle, isDirty, type Tab } from "$lib/stores/tabs.svelte";
  import { t } from "$lib/i18n";

  function requestClose(tab: Tab, e: MouseEvent) {
    e.stopPropagation();
    void tabs.closeWithConfirm(tab.id);
  }

  // Right-click context menu.
  let ctx = $state<{ x: number; y: number; tab: Tab } | null>(null);
  function openCtx(tab: Tab, e: MouseEvent) {
    e.preventDefault();
    ctx = { x: e.clientX, y: e.clientY, tab };
  }
  function run(fn: () => void) {
    ctx = null;
    fn();
  }

  // Drag-to-reorder.
  let dragFrom = $state<number | null>(null);
  function onDrop(to: number) {
    if (dragFrom !== null && dragFrom !== to) tabs.moveTab(dragFrom, to);
    dragFrom = null;
  }
</script>

<svelte:window
  onpointerdown={(e) => {
    if (ctx && !(e.target as HTMLElement).closest(".tab-ctx")) ctx = null;
  }}
  onkeydown={(e) => e.key === "Escape" && (ctx = null)}
/>

<div class="tabbar" role="tablist">
  {#each tabs.tabs as tab, i (tab.id)}
    <div
      class="tab"
      class:active={tab.id === tabs.activeId}
      class:dragover={dragFrom !== null && dragFrom !== i}
      role="tab"
      tabindex="0"
      aria-selected={tab.id === tabs.activeId}
      draggable="true"
      onclick={() => tabs.select(tab.id)}
      oncontextmenu={(e) => openCtx(tab, e)}
      onkeydown={(e) => (e.key === "Enter" || e.key === " ") && tabs.select(tab.id)}
      ondragstart={() => (dragFrom = i)}
      ondragover={(e) => e.preventDefault()}
      ondrop={() => onDrop(i)}
      ondragend={() => (dragFrom = null)}
    >
      <span class="dot" class:dirty={isDirty(tab)} aria-hidden="true"></span>
      <span class="title">{tabTitle(tab)}</span>
      <button class="close" title={t("tab.close")} onclick={(e) => requestClose(tab, e)}>×</button>
    </div>
  {/each}
  <button class="new-tab" title={t("tip.new")} onclick={() => tabs.newTab()}>+</button>
</div>

{#if ctx}
  {@const tab = ctx.tab}
  <div class="tab-ctx" role="menu" style:left="{ctx.x}px" style:top="{ctx.y}px">
    <button role="menuitem" onclick={() => run(() => tabs.closeWithConfirm(tab.id))}
      >{t("tab.close")}</button
    >
    <button
      role="menuitem"
      disabled={tabs.tabs.length < 2}
      onclick={() => run(() => tabs.closeOthers(tab.id))}>{t("tab.closeOthers")}</button
    >
    <button
      role="menuitem"
      disabled={tabs.tabs.findIndex((x) => x.id === tab.id) >= tabs.tabs.length - 1}
      onclick={() => run(() => tabs.closeToRight(tab.id))}>{t("tab.closeRight")}</button
    >
    <div class="sep" role="separator"></div>
    <button role="menuitem" disabled={!tab.path} onclick={() => run(() => tabs.copyPath(tab.id))}
      >{t("tab.copyPath")}</button
    >
    <button
      role="menuitem"
      disabled={!tab.path}
      onclick={() => run(() => tabs.revealInExplorer(tab.id))}>{t("tab.reveal")}</button
    >
  </div>
{/if}

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
  .tab.dragover {
    box-shadow: inset 2px 0 0 var(--accent);
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
  .tab-ctx {
    position: fixed;
    z-index: 30;
    min-width: 190px;
    padding: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  }
  .tab-ctx button {
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    color: var(--fg);
    padding: 6px 10px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
    text-align: left;
  }
  .tab-ctx button:hover:not(:disabled) {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .tab-ctx button:disabled {
    color: var(--fg-muted);
    cursor: default;
  }
  .tab-ctx .sep {
    height: 1px;
    background: var(--border);
    margin: 4px 6px;
  }
</style>
