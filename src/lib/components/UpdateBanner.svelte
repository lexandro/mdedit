<script lang="ts">
  import { updater } from "$lib/stores/updater.svelte";

  // Show the offer when an update is available and not dismissed; otherwise show
  // transient status (downloading / checking / up-to-date / error).
  let showOffer = $derived(
    updater.availableVersion !== null && !updater.dismissed && updater.status !== "downloading",
  );
  let statusText = $derived.by(() => {
    switch (updater.status) {
      case "checking":
        return "Checking for updates…";
      case "downloading":
        return `Downloading and installing ${updater.availableVersion ?? ""}…`;
      case "uptodate":
        return "You're up to date.";
      case "error":
        return `Update check failed: ${updater.message}`;
      default:
        return "";
    }
  });
</script>

{#if showOffer}
  <div class="banner offer" role="status">
    <span>Update available — <strong>v{updater.availableVersion}</strong></span>
    <div class="actions">
      <button class="install" onclick={() => updater.install()}>Install &amp; restart</button>
      <button class="later" onclick={() => updater.dismiss()}>Later</button>
    </div>
  </div>
{:else if statusText}
  <div class="banner status" class:err={updater.status === "error"} role="status">
    <span>{statusText}</span>
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
    border-bottom: 1px solid var(--border);
  }
  .offer {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .status {
    background: var(--bg-alt);
    color: var(--fg-muted);
  }
  .status.err {
    color: #e5484d;
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
  .install {
    background: var(--accent-fg);
    color: var(--accent);
    font-weight: 600;
  }
  .later {
    background: transparent;
    color: var(--accent-fg);
    border-color: var(--accent-fg);
  }
</style>
