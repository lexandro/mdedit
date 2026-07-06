<script lang="ts">
  import { fuzzyFilter } from "$lib/fuzzy";
  import { snippets } from "$lib/stores/snippets.svelte";
  import { insertSnippet, snippetLabel } from "$lib/editor-snippets";
  import { t } from "$lib/i18n";

  let { onClose }: { onClose: () => void } = $props();

  let query = $state("");
  let sel = $state(0);
  let input: HTMLInputElement | undefined;

  $effect(() => input?.focus());

  const items = $derived(
    snippets.all.map((s) => ({ s, label: snippetLabel(s), trigger: "/" + s.trigger })),
  );
  const filtered = $derived(fuzzyFilter(query, items, (i) => i.label + " " + i.trigger));
  // Keep the selection within bounds as the list shrinks/grows.
  $effect(() => {
    if (sel >= filtered.length) sel = Math.max(0, filtered.length - 1);
  });

  function pick(i: number) {
    const item = filtered[i];
    if (!item) return;
    insertSnippet(item.s);
    onClose();
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      sel = Math.min(sel + 1, filtered.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      sel = Math.max(sel - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(sel);
    } else if (e.key === "Escape") {
      onClose();
    }
  }
</script>

<div class="backdrop" role="presentation" onclick={onClose}></div>
<div class="palette" role="dialog" aria-modal="true" aria-label="Insert snippet">
  <input
    bind:this={input}
    bind:value={query}
    type="text"
    placeholder={t("snippet.placeholder")}
    aria-label="Snippet"
    onkeydown={onKeydown}
  />
  <div class="list" role="listbox" tabindex="-1">
    {#each filtered as item, i (item.s.id)}
      <button
        type="button"
        class="opt"
        role="option"
        aria-selected={i === sel}
        class:active={i === sel}
        onmousemove={() => (sel = i)}
        onclick={() => pick(i)}
      >
        <span>{item.label}</span>
        <span class="trigger">{item.trigger}</span>
      </button>
    {/each}
    {#if filtered.length === 0}
      <div class="empty">{t("snippet.empty")}</div>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 40;
  }
  .palette {
    position: fixed;
    top: 12%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 41;
    width: min(520px, 92vw);
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
    overflow: hidden;
  }
  input {
    width: 100%;
    box-sizing: border-box;
    border: none;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    color: var(--fg);
    padding: 12px 14px;
    font: inherit;
    font-size: 15px;
  }
  input:focus {
    outline: none;
  }
  .list {
    padding: 4px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .opt {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    border: none;
    background: transparent;
    color: var(--fg);
    text-align: left;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }
  .opt .trigger {
    color: var(--fg-muted);
    font-family: var(--font-mono, monospace);
    font-size: 12px;
  }
  .opt.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .opt.active .trigger {
    color: var(--accent-fg);
  }
  .empty {
    padding: 7px 10px;
    color: var(--fg-muted);
    font-size: 13px;
  }
</style>
