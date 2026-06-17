<script lang="ts">
  import { onMount } from "svelte";
  import { getVersion } from "@tauri-apps/api/app";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { updater } from "$lib/stores/updater.svelte";

  let { onClose }: { onClose: () => void } = $props();

  const REPO = "https://github.com/lexandro/mdedit";
  let version = $state("");

  onMount(async () => {
    try {
      version = await getVersion();
    } catch {
      version = "dev";
    }
  });

  function open(url: string) {
    openUrl(url).catch(() => {});
  }
</script>

<div
  class="backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>
<div class="dialog" role="dialog" aria-modal="true" aria-label="About mdedit">
  <button class="x" onclick={onClose} aria-label="Close">×</button>

  <img class="logo" src="/app-icon.png" alt="mdedit logo" width="72" height="72" />
  <h2>mdedit</h2>
  <p class="version">Version {version || "…"}</p>
  <p class="tagline">A fast, native Windows Markdown editor — Tauri 2 + Svelte.</p>

  <div class="links">
    <button onclick={() => open(REPO)}>GitHub repository</button>
    <button onclick={() => open(`${REPO}/releases`)}>Releases</button>
    <button onclick={() => open(`${REPO}/blob/main/LICENSE`)}>License (MIT)</button>
  </div>

  <button
    class="update"
    onclick={() => {
      void updater.check(true);
      onClose();
    }}
  >
    Check for updates
  </button>

  <p class="copyright">© 2026 lexandro · MIT License</p>
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
    width: min(360px, 90vw);
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px 20px 18px;
    z-index: 11;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
  }
  .x {
    position: absolute;
    top: 8px;
    right: 10px;
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font-size: 20px;
    cursor: pointer;
  }
  .logo {
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  }
  h2 {
    margin: 10px 0 2px;
    font-size: 20px;
  }
  .version {
    margin: 0;
    color: var(--fg-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .tagline {
    margin: 10px 0 16px;
    font-size: 13px;
    color: var(--fg-muted);
  }
  .links {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
  }
  .links button {
    border: none;
    background: transparent;
    color: var(--accent);
    cursor: pointer;
    font-size: 13px;
    padding: 4px;
    border-radius: 5px;
  }
  .links button:hover {
    background: var(--bg-alt);
  }
  .update {
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    padding: 7px 14px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 13px;
  }
  .update:hover {
    border-color: var(--accent);
  }
  .copyright {
    margin: 16px 0 0;
    font-size: 11px;
    color: var(--fg-muted);
  }
</style>
