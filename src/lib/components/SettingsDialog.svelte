<script lang="ts">
  import {
    settings,
    type ThemeChoice,
    type ViewMode,
    type SplitOrientation,
  } from "$lib/stores/settings.svelte";
  import { runUpdateCheck, type UpdateStatus } from "$lib/updater";

  let { onClose }: { onClose: () => void } = $props();

  const themes: ThemeChoice[] = ["light", "dark", "system"];
  const modes: ViewMode[] = ["source", "split", "preview"];
  const orientations: SplitOrientation[] = ["vertical", "horizontal"];

  let update = $state<UpdateStatus>({ kind: "idle" });
  let updateLabel = $derived.by(() => {
    switch (update.kind) {
      case "checking":
        return "Checking…";
      case "none":
        return "You're up to date.";
      case "downloading":
        return `Downloading ${update.version}…`;
      case "ready":
        return `Installed ${update.version}, restarting…`;
      case "error":
        return `Update check failed: ${update.message}`;
      default:
        return "";
    }
  });
</script>

<div
  class="backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>
<div class="dialog" role="dialog" aria-modal="true" aria-label="Settings">
  <header>
    <h2>Settings</h2>
    <button class="x" onclick={onClose} aria-label="Close">×</button>
  </header>

  <section>
    <h3>Theme</h3>
    <div class="seg">
      {#each themes as t (t)}
        <button class:active={settings.theme === t} onclick={() => settings.setTheme(t)}>{t}</button>
      {/each}
    </div>
  </section>

  <section>
    <h3>Default view mode</h3>
    <div class="seg">
      {#each modes as m (m)}
        <button
          class:active={settings.defaultViewMode === m}
          onclick={() => settings.setDefaultViewMode(m)}>{m}</button
        >
      {/each}
    </div>
  </section>

  <section>
    <h3>Split orientation</h3>
    <div class="seg">
      {#each orientations as o (o)}
        <button
          class:active={settings.splitOrientation === o}
          onclick={() => settings.setSplitOrientation(o)}>{o}</button
        >
      {/each}
    </div>
  </section>

  <section>
    <h3>Updates</h3>
    <div class="update-row">
      <button
        class="update-btn"
        disabled={update.kind === "checking" || update.kind === "downloading"}
        onclick={() => runUpdateCheck((s) => (update = s))}
      >
        Check for updates
      </button>
      {#if updateLabel}<span class="update-status">{updateLabel}</span>{/if}
    </div>
  </section>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10;
  }
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(420px, 90vw);
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 20px 20px;
    z-index: 11;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 16px;
    margin: 0;
  }
  h3 {
    font-size: 13px;
    color: var(--fg-muted);
    margin: 16px 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .x {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font-size: 20px;
    cursor: pointer;
  }
  .seg {
    display: flex;
    gap: 4px;
  }
  .seg button {
    flex: 1;
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    text-transform: capitalize;
    font-size: 13px;
  }
  .seg button.active {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .update-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .update-btn {
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .update-btn:hover:not(:disabled) {
    border-color: var(--accent);
  }
  .update-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .update-status {
    font-size: 12px;
    color: var(--fg-muted);
  }
</style>
