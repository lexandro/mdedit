<script lang="ts">
  import { fileAssoc } from "$lib/stores/fileassoc.svelte";
  import { t } from "$lib/i18n";
</script>

{#if fileAssoc.showPrompt}
  <div class="banner" role="status">
    <span>{t("assoc.prompt")}</span>
    <div class="actions">
      <button class="set" onclick={() => fileAssoc.register()}>{t("assoc.set")}</button>
      <button class="later" onclick={() => fileAssoc.dismiss()}>{t("assoc.dismiss")}</button>
    </div>
  </div>
{/if}

<style>
  .banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 12px;
    font-size: 13px;
    background: var(--bg-alt);
    color: var(--fg);
    border-bottom: 1px solid var(--border);
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .banner button {
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 3px 10px;
    cursor: pointer;
    font-size: 12px;
  }
  .set {
    background: var(--accent);
    color: var(--accent-fg);
    font-weight: 600;
  }
  .later {
    background: transparent;
    color: var(--fg-muted);
    border-color: var(--border);
  }
</style>
