<script lang="ts">
  import { tabs, isDirty } from "$lib/stores/tabs.svelte";
  import { editorStatus } from "$lib/stores/editor-status.svelte";
  import { t } from "$lib/i18n";

  const ENCODING_LABEL: Record<string, string> = {
    "utf-8": "UTF-8",
    "utf-8-bom": "UTF-8 BOM",
    "utf-16le": "UTF-16 LE",
    "utf-16be": "UTF-16 BE",
    "windows-1250": "Windows-1250",
  };

  let wordCount = $derived.by(() => {
    const text = tabs.active?.content.trim() ?? "";
    return text ? text.split(/\s+/).length : 0;
  });
  let charCount = $derived(tabs.active?.content.length ?? 0);
  let readMinutes = $derived(Math.max(1, Math.ceil(wordCount / 200)));

  function toggleLineEnding() {
    if (!tabs.active) return;
    tabs.setLineEnding(tabs.active.id, tabs.active.lineEnding === "lf" ? "crlf" : "lf");
  }
</script>

<footer class="statusbar">
  {#if tabs.active}
    <span>{isDirty(tabs.active) ? t("status.modified") : t("status.saved")}</span>
    <button class="status-btn" title={t("status.toggleEnding")} onclick={toggleLineEnding}>
      {tabs.active.lineEnding.toUpperCase()}
    </button>
    <span>{ENCODING_LABEL[tabs.active.encoding]}</span>
    <span class="spacer"></span>
    <span>{t("status.lncol", { line: editorStatus.line, col: editorStatus.col })}</span>
    <span>{t("status.words", { n: wordCount })}</span>
    <span>{t("status.chars", { n: charCount })}</span>
    <span>{t("status.read", { n: readMinutes })}</span>
  {:else}
    <span class="spacer"></span>
  {/if}
</footer>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 3px 12px;
    font-size: 12px;
    color: var(--fg-muted);
    background: var(--bg-alt);
    border-top: 1px solid var(--border);
  }
  .spacer {
    flex: 1;
  }
  .status-btn {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font: inherit;
    padding: 0 4px;
    border-radius: 4px;
    cursor: pointer;
  }
  .status-btn:hover {
    background: var(--border);
    color: var(--fg);
  }
</style>
