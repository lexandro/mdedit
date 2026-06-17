<script lang="ts">
  // Custom in-app menu bar (replaces the native OS menu so it scales with the
  // UI zoom and matches the theme). Dispatches every item through onCommand.
  import { recent } from "$lib/stores/recent.svelte";
  import { basename } from "$lib/stores/tabs.svelte";

  type Item = { label: string; id?: string; shortcut?: string; children?: Item[] } | "sep";
  interface Menu {
    label: string;
    items: Item[];
  }

  let { onCommand }: { onCommand: (id: string) => void } = $props();

  let recentItems = $derived<Item[]>(
    recent.paths.length
      ? recent.paths.map((p) => ({ label: basename(p), id: `open_recent:${p}` }))
      : [{ label: "(no recent files)" }],
  );

  let menus = $derived<Menu[]>([
    {
      label: "File",
      items: [
        { label: "New", id: "new", shortcut: "Ctrl+N" },
        { label: "Open…", id: "open", shortcut: "Ctrl+O" },
        { label: "Open Recent", children: recentItems },
        "sep",
        { label: "Save", id: "save", shortcut: "Ctrl+S" },
        { label: "Save As…", id: "save_as", shortcut: "Ctrl+Shift+S" },
        { label: "Save All", id: "save_all", shortcut: "Ctrl+Alt+S" },
        "sep",
        { label: "Export HTML…", id: "export_html" },
        { label: "Export to PDF…", id: "export_pdf" },
        "sep",
        { label: "Close Tab", id: "close_tab", shortcut: "Ctrl+W" },
        { label: "Reopen Closed Tab", id: "reopen_closed", shortcut: "Ctrl+Shift+T" },
        "sep",
        { label: "Exit", id: "quit" },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", id: "undo", shortcut: "Ctrl+Z" },
        { label: "Redo", id: "redo", shortcut: "Ctrl+Y" },
        "sep",
        { label: "Cut", id: "cut", shortcut: "Ctrl+X" },
        { label: "Copy", id: "copy", shortcut: "Ctrl+C" },
        { label: "Paste", id: "paste", shortcut: "Ctrl+V" },
        "sep",
        { label: "Select All", id: "select_all", shortcut: "Ctrl+A" },
        "sep",
        { label: "Insert Table", id: "insert_table" },
        { label: "Format Tables", id: "format_tables" },
        { label: "Copy as HTML", id: "copy_html" },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Source", id: "view_source", shortcut: "Ctrl+1" },
        { label: "Split", id: "view_split", shortcut: "Ctrl+2" },
        { label: "Preview", id: "view_preview", shortcut: "Ctrl+3" },
        "sep",
        { label: "Toggle Split Orientation", id: "toggle_orientation" },
        { label: "Toggle Outline", id: "toggle_outline" },
        { label: "Toggle Word Wrap", id: "toggle_word_wrap" },
        "sep",
        { label: "Settings…", id: "settings" },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Check for Updates…", id: "check_updates" },
        "sep",
        { label: "Changelog", id: "changelog" },
        { label: "About mdedit", id: "about" },
      ],
    },
  ]);

  let open = $state<number | null>(null);
  let subOpen = $state<string | null>(null);

  function toggle(i: number) {
    open = open === i ? null : i;
    subOpen = null;
  }
  function hover(i: number) {
    if (open !== null) {
      open = i; // switch menus on hover while one is open
      subOpen = null;
    }
  }
  function choose(id: string | undefined) {
    if (!id) return; // placeholder / non-actionable row
    open = null;
    subOpen = null;
    onCommand(id);
  }
  function onWindowPointerDown(e: PointerEvent) {
    if (open !== null && !(e.target as HTMLElement).closest(".menubar")) {
      open = null;
      subOpen = null;
    }
  }
</script>

<svelte:window
  onpointerdown={onWindowPointerDown}
  onkeydown={(e) => e.key === "Escape" && (open = null)}
/>

<div class="menubar" role="menubar">
  {#each menus as menu, i (menu.label)}
    <div class="menu">
      <button
        class="top"
        class:active={open === i}
        aria-haspopup="true"
        aria-expanded={open === i}
        onclick={() => toggle(i)}
        onmouseenter={() => hover(i)}
      >
        {menu.label}
      </button>
      {#if open === i}
        <div class="dropdown" role="menu">
          {#each menu.items as item, j (j)}
            {#if item === "sep"}
              <div class="sep" role="separator"></div>
            {:else if item.children}
              <div
                class="item sub-parent"
                role="menuitem"
                tabindex="-1"
                aria-haspopup="true"
                onmouseenter={() => (subOpen = `${i}-${j}`)}
                onmouseleave={() => (subOpen = null)}
              >
                <span class="label">{item.label}</span>
                <span class="arrow" aria-hidden="true">▸</span>
                {#if subOpen === `${i}-${j}`}
                  <div class="dropdown sub" role="menu">
                    {#each item.children as child, k (k)}
                      {#if child === "sep"}
                        <div class="sep" role="separator"></div>
                      {:else if child.id}
                        <button class="item" role="menuitem" onclick={() => choose(child.id)}>
                          <span class="label">{child.label}</span>
                        </button>
                      {:else}
                        <div class="item disabled">{child.label}</div>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            {:else if item.id}
              <button class="item" role="menuitem" onclick={() => choose(item.id)}>
                <span class="label">{item.label}</span>
                {#if item.shortcut}<span class="shortcut">{item.shortcut}</span>{/if}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .menubar {
    display: flex;
    align-items: stretch;
    background: var(--bg-alt);
    border-bottom: 1px solid var(--border);
    user-select: none;
  }
  .menu {
    position: relative;
  }
  .top {
    border: none;
    background: transparent;
    color: var(--fg);
    padding: 4px 12px;
    height: 100%;
    cursor: pointer;
    font-size: 13px;
  }
  .top:hover,
  .top.active {
    background: var(--border);
  }
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 20;
    min-width: 200px;
    padding: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
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
  .item:hover {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .shortcut {
    color: var(--fg-muted);
    font-size: 12px;
  }
  .item:hover .shortcut {
    color: var(--accent-fg);
    opacity: 0.8;
  }
  .sep {
    height: 1px;
    background: var(--border);
    margin: 4px 6px;
  }
  .sub-parent {
    position: relative;
    cursor: default;
  }
  .arrow {
    color: var(--fg-muted);
    font-size: 11px;
  }
  .sub-parent:hover .arrow {
    color: var(--accent-fg);
  }
  .dropdown.sub {
    top: -5px;
    left: 100%;
    max-height: 70vh;
    overflow: auto;
  }
  .item.disabled {
    color: var(--fg-muted);
    cursor: default;
  }
  .item.disabled:hover {
    background: transparent;
    color: var(--fg-muted);
  }
</style>
