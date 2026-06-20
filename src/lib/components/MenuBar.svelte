<script lang="ts">
  // Custom in-app menu bar (replaces the native OS menu so it scales with the
  // UI zoom and matches the theme). Dispatches every item through onCommand.
  import { recent } from "$lib/stores/recent.svelte";
  import { basename } from "$lib/stores/tabs.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { mnemonicIndex } from "$lib/menu-util";
  import { t } from "$lib/i18n";

  type Item =
    | { label: string; id?: string; shortcut?: string; children?: Item[]; checked?: boolean; hint?: string }
    | "sep";
  interface Menu {
    label: string;
    items: Item[];
  }

  let { onCommand, outlineVisible }: { onCommand: (id: string) => void; outlineVisible: boolean } =
    $props();

  let recentItems = $derived<Item[]>(
    recent.entries.length
      ? [
          ...recent.entries.map((e) => ({
            label: (e.pinned ? "📌 " : "") + basename(e.path),
            id: `open_recent:${e.path}`,
          })),
          "sep" as const,
          { label: t("cmd.clear_recent"), id: "clear_recent" },
        ]
      : [{ label: t("menu.noRecent") }],
  );

  let menus = $derived<Menu[]>([
    {
      label: t("menu.file"),
      items: [
        { label: t("cmd.new"), id: "new", shortcut: "Ctrl+N" },
        { label: t("cmd.open"), id: "open", shortcut: "Ctrl+O" },
        { label: t("menu.openRecent"), children: recentItems },
        "sep",
        { label: t("cmd.save"), id: "save", shortcut: "Ctrl+S" },
        { label: t("cmd.save_as"), id: "save_as", shortcut: "Ctrl+Shift+S" },
        { label: t("cmd.save_all"), id: "save_all", shortcut: "Ctrl+Alt+S" },
        "sep",
        { label: t("cmd.export_html"), id: "export_html" },
        { label: t("cmd.export_pdf"), id: "export_pdf" },
        "sep",
        { label: t("cmd.close_tab"), id: "close_tab", shortcut: "Ctrl+W" },
        { label: t("cmd.reopen_closed"), id: "reopen_closed", shortcut: "Ctrl+Shift+T" },
        "sep",
        { label: t("cmd.quit"), id: "quit" },
      ],
    },
    {
      label: t("menu.edit"),
      items: [
        { label: t("cmd.undo"), id: "undo", shortcut: "Ctrl+Z" },
        { label: t("cmd.redo"), id: "redo", shortcut: "Ctrl+Y" },
        "sep",
        { label: t("cmd.cut"), id: "cut", shortcut: "Ctrl+X" },
        { label: t("cmd.copy"), id: "copy", shortcut: "Ctrl+C" },
        { label: t("cmd.paste"), id: "paste", shortcut: "Ctrl+V" },
        { label: t("cmd.paste_as_markdown"), id: "paste_as_markdown", shortcut: "Ctrl+Shift+V" },
        "sep",
        { label: t("cmd.select_all"), id: "select_all", shortcut: "Ctrl+A" },
        { label: t("cmd.goto_line"), id: "goto_line", shortcut: "Ctrl+G" },
        "sep",
        { label: t("cmd.insert_table"), id: "insert_table" },
        { label: t("cmd.insert_toc"), id: "insert_toc" },
        { label: t("cmd.insert_emoji"), id: "insert_emoji" },
        { label: t("cmd.format_tables"), id: "format_tables" },
        { label: t("cmd.format_document"), id: "format_document" },
        { label: t("cmd.copy_html"), id: "copy_html" },
      ],
    },
    {
      label: t("menu.view"),
      items: [
        { label: t("view.source"), id: "view_source", shortcut: "Ctrl+1" },
        { label: t("view.split"), id: "view_split", shortcut: "Ctrl+2" },
        { label: t("view.preview"), id: "view_preview", shortcut: "Ctrl+3" },
        { label: t("view.live"), id: "view_live", shortcut: "Ctrl+4" },
        "sep",
        {
          label: t("cmd.toggle_orientation"),
          id: "toggle_orientation",
          hint: t(`orientation.${settings.splitOrientation}`),
        },
        { label: t("cmd.toggle_outline"), id: "toggle_outline", checked: outlineVisible },
        { label: t("cmd.toggle_word_wrap"), id: "toggle_word_wrap", checked: settings.wordWrap },
        "sep",
        { label: t("cmd.settings"), id: "settings" },
      ],
    },
    {
      label: t("menu.help"),
      items: [
        { label: t("cmd.check_updates"), id: "check_updates" },
        "sep",
        { label: t("cmd.changelog"), id: "changelog" },
        { label: t("cmd.about"), id: "about" },
      ],
    },
  ]);

  let open = $state<number | null>(null);
  let subOpen = $state<string | null>(null);
  let altMode = $state(false); // show access-key underlines while Alt is held

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
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      open = null;
      subOpen = null;
      altMode = false;
    } else if (e.key === "Alt" && !e.repeat) {
      altMode = true;
    } else if (e.altKey && /^[a-z]$/i.test(e.key)) {
      const idx = mnemonicIndex(
        menus.map((m) => m.label),
        e.key,
      );
      if (idx >= 0) {
        e.preventDefault();
        open = idx;
        subOpen = null;
        altMode = true;
      }
    }
  }
  function onKeyup(e: KeyboardEvent) {
    if (e.key === "Alt") altMode = false;
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onKeydown} onkeyup={onKeyup} />

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
        {#if altMode}<u>{menu.label[0]}</u>{menu.label.slice(1)}{:else}{menu.label}{/if}
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
              <button
                class="item"
                role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"}
                aria-checked={item.checked === undefined ? undefined : item.checked}
                onclick={() => choose(item.id)}
              >
                {#if item.checked !== undefined}
                  <span class="check">{item.checked ? "✓" : ""}</span>
                {/if}
                <span class="label">{item.label}</span>
                {#if item.hint}<span class="shortcut">{item.hint}</span>{/if}
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
  .check {
    flex: 0 0 14px;
    text-align: center;
    color: var(--accent);
  }
  .item:hover .check {
    color: var(--accent-fg);
  }
  .label {
    flex: 1;
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
