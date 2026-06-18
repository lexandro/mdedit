<script lang="ts">
  import { fuzzyFilter } from "$lib/fuzzy";
  import { paletteCommands } from "$lib/command-list";

  let { onRun, onClose }: { onRun: (id: string) => void; onClose: () => void } = $props();

  let query = $state("");
  let sel = $state(0);
  let input: HTMLInputElement | undefined;

  $effect(() => input?.focus());

  const filtered = $derived(fuzzyFilter(query, paletteCommands, (c) => c.label));
  // Keep the selection within bounds as the list shrinks/grows.
  $effect(() => {
    if (sel >= filtered.length) sel = Math.max(0, filtered.length - 1);
  });

  function run(i: number) {
    const cmd = filtered[i];
    if (cmd) onRun(cmd.id);
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
      run(sel);
    } else if (e.key === "Escape") {
      onClose();
    }
  }
</script>

<div class="backdrop" role="presentation" onclick={onClose}></div>
<div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
  <input
    bind:this={input}
    bind:value={query}
    type="text"
    placeholder="Type a command…"
    aria-label="Command"
    onkeydown={onKeydown}
  />
  <div class="list" role="listbox" tabindex="-1">
    {#each filtered as cmd, i (cmd.id)}
      <button
        type="button"
        class="opt"
        role="option"
        aria-selected={i === sel}
        class:active={i === sel}
        onmousemove={() => (sel = i)}
        onclick={() => run(i)}
      >
        {cmd.label}
      </button>
    {/each}
    {#if filtered.length === 0}
      <div class="empty">No matching command</div>
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
    display: block;
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
  .opt.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .empty {
    padding: 7px 10px;
    color: var(--fg-muted);
    font-size: 13px;
  }
</style>
