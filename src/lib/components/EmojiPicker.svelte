<script lang="ts">
  import { filterEmoji } from "$lib/emoji-search";
  import { emojiList } from "$lib/emoji-data";
  import { insertText } from "$lib/editor-commands";

  let { onClose }: { onClose: () => void } = $props();

  let query = $state("");
  let input: HTMLInputElement | undefined;
  $effect(() => input?.focus());

  const results = $derived(filterEmoji(query, emojiList));

  function pick(char: string) {
    insertText(char);
    onClose();
  }
</script>

<div class="backdrop" role="presentation" onclick={onClose}></div>
<div class="picker" role="dialog" aria-modal="true" aria-label="Insert emoji">
  <input
    bind:this={input}
    bind:value={query}
    type="text"
    placeholder="Search emoji (e.g. smile, heart)…"
    aria-label="Search emoji"
    onkeydown={(e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Enter" && results[0]) pick(results[0].char);
    }}
  />
  <div class="grid">
    {#each results as e (e.shortcode)}
      <button type="button" title={`:${e.shortcode}:`} onclick={() => pick(e.char)}>{e.char}</button
      >
    {/each}
    {#if results.length === 0}
      <div class="empty">No emoji found</div>
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
  .picker {
    position: fixed;
    top: 14%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 41;
    width: min(420px, 92vw);
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
    font-size: 14px;
  }
  input:focus {
    outline: none;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    padding: 8px;
    max-height: 46vh;
    overflow-y: auto;
  }
  .grid button {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
    padding: 6px 0;
    border-radius: 6px;
  }
  .grid button:hover {
    background: var(--bg-alt);
  }
  .empty {
    grid-column: 1 / -1;
    padding: 16px;
    text-align: center;
    color: var(--fg-muted);
    font-size: 13px;
  }
</style>
