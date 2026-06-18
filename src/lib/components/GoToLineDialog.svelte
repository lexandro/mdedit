<script lang="ts">
  import { goToLine } from "$lib/editor-commands";
  import { t } from "$lib/i18n";

  let { onClose }: { onClose: () => void } = $props();
  let value = $state("");
  let input: HTMLInputElement | undefined;

  $effect(() => input?.focus());

  function submit() {
    const n = parseInt(value, 10);
    if (Number.isFinite(n)) goToLine(n);
    onClose();
  }
</script>

<div
  class="backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>
<div class="dialog" role="dialog" aria-modal="true" aria-label={t("goto.title")}>
  <label for="goto-line">{t("goto.title")}</label>
  <input
    id="goto-line"
    bind:this={input}
    bind:value
    type="number"
    min="1"
    placeholder={t("goto.placeholder")}
    onkeydown={(e) => {
      if (e.key === "Enter") submit();
      else if (e.key === "Escape") onClose();
    }}
  />
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 10;
  }
  .dialog {
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 11;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(280px, 90vw);
    padding: 16px;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
  label {
    font-size: 12px;
    color: var(--fg-muted);
  }
  input {
    background: var(--bg-alt);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 7px 10px;
    font: inherit;
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
  }
</style>
