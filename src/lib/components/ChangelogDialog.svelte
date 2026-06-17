<script lang="ts">
  import { renderMarkdown } from "$lib/markdown/renderer";
  // Inlined at build time so the changelog always matches the shipped version.
  import changelog from "../../../CHANGELOG.md?raw";

  let { onClose }: { onClose: () => void } = $props();

  const html = renderMarkdown(changelog, null);
</script>

<div
  class="backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>
<div class="dialog" role="dialog" aria-modal="true" aria-label="Changelog">
  <header>
    <h2>Changelog</h2>
    <button class="x" onclick={onClose} aria-label="Close">×</button>
  </header>
  <div class="body markdown-body">
    {@html html}
  </div>
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
    width: min(640px, 92vw);
    max-height: 82vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    z-index: 11;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }
  .x {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font-size: 20px;
    cursor: pointer;
  }
  .body {
    overflow: auto;
    padding: 4px 24px 20px;
  }
</style>
