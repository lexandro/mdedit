<script lang="ts">
  import { toasts } from "$lib/stores/toasts.svelte";
  import { t } from "$lib/i18n";
</script>

<div class="toasts" role="region" aria-label={t("a11y.notifications")} aria-live="polite">
  {#each toasts.items as item (item.id)}
    <div class="toast {item.kind}" role="alert">
      <span class="msg">{item.message}</span>
      <button class="x" aria-label={t("a11y.dismiss")} onclick={() => toasts.dismiss(item.id)}
        >×</button
      >
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    right: 12px;
    bottom: 12px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: min(420px, 90vw);
  }
  .toast {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    color: #fff;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
  .toast.error {
    background: #d5413e;
  }
  .toast.success {
    background: #2e7d46;
  }
  .toast.info {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .msg {
    flex: 1;
    word-break: break-word;
  }
  .x {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.85;
  }
  .x:hover {
    opacity: 1;
  }
</style>
