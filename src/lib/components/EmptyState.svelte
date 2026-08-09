<script lang="ts">
  import { tabs, basename } from "$lib/stores/tabs.svelte";
  import { recent } from "$lib/stores/recent.svelte";
  import { displayDir } from "$lib/path-display";
  import { t } from "$lib/i18n";
</script>

<div class="empty">
  <img class="logo" src="/app-icon.png" alt="mdedit logo" width="96" height="96" />
  <h1>mdedit</h1>
  <p>{t("empty.noFile")}</p>
  <div class="empty-actions">
    <button onclick={() => tabs.newTab()}>{t("empty.new")}</button>
    <button onclick={() => tabs.open()}>{t("empty.open")}</button>
  </div>
  {#if recent.entries.length > 0}
    <div class="recent">
      <div class="recent-head">
        <h2>{t("empty.recent")}</h2>
        <button class="clear" onclick={() => recent.clearRecent()}>{t("empty.clear")}</button>
      </div>
      <ul>
        {#each recent.entries as { path, pinned } (path)}
          <li>
            <button
              class="pin"
              class:pinned
              title={pinned ? t("empty.unpin") : t("empty.pin")}
              aria-label={pinned ? t("empty.unpin") : t("empty.pin")}
              onclick={() => (pinned ? recent.unpin(path) : recent.pin(path))}>📌</button
            >
            <button class="recent-item" title={path} onclick={() => tabs.openPath(path)}>
              <span class="name">{basename(path)}</span>
              <span class="path">{displayDir(path)}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  <p class="hint">{t("empty.hint")}</p>
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
    /* Wide enough that a file name and its folder share one line: at 460px the
       name wrapped mid-word and the folder overflowed the list. */
    width: min(780px, 88vw);
  }
  .recent-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin: 0 0 6px;
  }
  .recent h2 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted);
    margin: 0;
  }
  .clear {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    cursor: pointer;
    font-size: 12px;
  }
  .clear:hover {
    color: var(--accent);
  }
  .recent ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .recent li {
    display: flex;
    align-items: center;
  }
  .pin {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0 4px;
    font-size: 12px;
    opacity: 0.25;
    filter: grayscale(1);
  }
  .pin:hover,
  .pin.pinned {
    opacity: 1;
    filter: none;
  }
  .recent-item {
    display: flex;
    align-items: baseline;
    gap: 16px;
    width: 100%;
    min-width: 0;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--fg);
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .recent-item:hover {
    background: var(--bg-alt);
  }
  /* Both columns must be allowed to shrink (min-width: 0) or the nowrap folder
     pushes the row wider than the list instead of ellipsising. */
  .recent-item .name {
    flex: 0 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Left-aligned right after the name, so a row reads as one phrase; the muted
     colour alone carries the hierarchy, no need to shrink it too. */
  .recent-item .path {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--fg-muted);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
