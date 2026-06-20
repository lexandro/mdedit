<script lang="ts">
  import { goToLine } from "$lib/editor-commands";
  import { parseHeadings } from "$lib/md-headings";
  import { t } from "$lib/i18n";

  let { content }: { content: string } = $props();

  let headings = $derived(parseHeadings(content));
</script>

<aside class="outline">
  <div class="title">{t("outline.title")}</div>
  {#if headings.length === 0}
    <p class="empty">{t("outline.empty")}</p>
  {:else}
    <ul>
      {#each headings as h (h.line)}
        <li>
          <button style="padding-left: {(h.level - 1) * 12 + 8}px" onclick={() => goToLine(h.line)}>
            {h.text}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</aside>

<style>
  .outline {
    width: 240px;
    flex: 0 0 240px;
    height: 100%;
    overflow: auto;
    border-right: 1px solid var(--border);
    background: var(--bg-alt);
  }
  .title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted);
    padding: 8px 10px 4px;
  }
  .empty {
    color: var(--fg-muted);
    font-size: 12px;
    padding: 4px 10px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0 0 8px;
  }
  li button {
    display: block;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--fg);
    padding: 4px 8px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  li button:hover {
    background: var(--border);
  }
</style>
