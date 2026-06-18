<script lang="ts">
  import { tabs, basename } from "$lib/stores/tabs.svelte";
  import { recent } from "$lib/stores/recent.svelte";
</script>

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

<style>
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
</style>
