<script lang="ts">
  import { snippets } from "$lib/stores/snippets.svelte";
  import { BUILTIN_SNIPPETS } from "$lib/snippets";
  import { validateUserSnippet, type SnippetFieldError } from "$lib/user-snippets";
  import { toasts } from "$lib/stores/toasts.svelte";
  import { t } from "$lib/i18n";

  let { onClose }: { onClose: () => void } = $props();

  let selectedId = $state<string | null>(null);
  let label = $state("");
  let trigger = $state("");
  let body = $state("");
  let template = $state(false);
  let error = $state<SnippetFieldError | null>(null);

  const shadows = $derived(BUILTIN_SNIPPETS.some((b) => b.trigger === trigger));

  function select(id: string | null) {
    const s = snippets.user.find((u) => u.id === id);
    selectedId = s?.id ?? null;
    label = s?.label ?? "";
    trigger = s?.trigger ?? "";
    body = s?.body ?? "";
    template = s?.template ?? false;
    error = null;
  }

  function save() {
    const draft = { label: label.trim(), trigger, body };
    error = validateUserSnippet(
      draft,
      snippets.user.filter((u) => u.id !== selectedId),
    );
    if (error) return;
    const id = selectedId ?? crypto.randomUUID();
    snippets
      .upsert({ id, ...draft, ...(template && { template }) })
      .then(() => select(id))
      .catch((e) => toasts.error(t("toast.snippetSaveFail"), e));
  }

  function remove() {
    if (selectedId == null) return;
    snippets
      .remove(selectedId)
      .then(() => select(null))
      .catch((e) => toasts.error(t("toast.snippetSaveFail"), e));
  }
</script>

<div
  class="backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>
<div class="dialog" role="dialog" aria-modal="true" aria-label={t("snippetmgr.title")}>
  <header>
    <h2>{t("snippetmgr.title")}</h2>
    <button class="x" onclick={onClose} aria-label={t("settings.close")}>×</button>
  </header>

  <div class="layout">
    <div class="side">
      <button class="new" class:active={selectedId === null} onclick={() => select(null)}>
        + {t("snippetmgr.new")}
      </button>
      <div class="list">
        {#each snippets.user as s (s.id)}
          <button class="item" class:active={s.id === selectedId} onclick={() => select(s.id)}>
            <span class="name">{s.label}</span>
            <span class="trig">/{s.trigger}</span>
          </button>
        {/each}
        {#if snippets.user.length === 0}
          <p class="empty">{t("snippetmgr.empty")}</p>
        {/if}
      </div>
    </div>

    <div class="form">
      <label>
        {t("snippetmgr.name")}
        <input type="text" bind:value={label} />
      </label>
      <label>
        {t("snippetmgr.trigger")}
        <div class="trigger-row">
          <span class="slash">/</span>
          <input type="text" bind:value={trigger} spellcheck="false" />
        </div>
      </label>
      <p class="hint">
        {t("snippetmgr.triggerHint")}
        {#if shadows}{t("snippetmgr.shadows", { trigger })}{/if}
      </p>
      <label class="grow">
        {t("snippetmgr.body")}
        <textarea bind:value={body} spellcheck="false"></textarea>
      </label>
      <p class="hint">{t("snippetmgr.bodyHint")}</p>
      <label class="check">
        <input type="checkbox" bind:checked={template} />
        {t("snippetmgr.template")}
      </label>

      <footer>
        {#if error}<span class="error">{t(`snippetmgr.err.${error}`)}</span>{/if}
        {#if selectedId != null}
          <button class="danger" onclick={remove}>{t("snippetmgr.delete")}</button>
        {/if}
        <button class="primary" onclick={save}>{t("snippetmgr.save")}</button>
      </footer>
    </div>
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
    /* Fixed size (like Settings): sized for 1080p-and-up displays. */
    width: min(760px, 92vw);
    height: min(560px, 88vh);
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    z-index: 11;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    font-size: 16px;
    margin: 0;
  }
  .x {
    border: none;
    background: transparent;
    color: var(--fg-muted);
    font-size: 20px;
    cursor: pointer;
  }
  .layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .side {
    flex: 0 0 220px;
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 2px;
    border-right: 1px solid var(--border);
    background: var(--bg-alt);
    min-height: 0;
  }
  .list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .side button {
    border: none;
    background: transparent;
    color: var(--fg);
    text-align: left;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .side button:hover {
    background: var(--border);
  }
  .side button.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .item .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item .trig {
    color: var(--fg-muted);
    font-family: var(--font-mono, monospace);
    font-size: 12px;
  }
  .item.active .trig {
    color: var(--accent-fg);
  }
  .empty {
    padding: 7px 10px;
    color: var(--fg-muted);
    font-size: 12px;
    margin: 0;
  }
  .form {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 20px 16px;
    gap: 8px;
    overflow-y: auto;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--fg-muted);
  }
  label.check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  label.check input {
    width: auto;
  }
  label.grow {
    flex: 1;
    min-height: 0;
  }
  input,
  textarea {
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    padding: 7px 10px;
    border-radius: 6px;
    font: inherit;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
  }
  textarea {
    flex: 1;
    min-height: 90px;
    resize: none;
    font-family: var(--font-mono, monospace);
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  .trigger-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .slash {
    font-family: var(--font-mono, monospace);
    color: var(--fg-muted);
  }
  .hint {
    font-size: 12px;
    color: var(--fg-muted);
    margin: 0;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }
  .error {
    color: var(--danger, #d33);
    font-size: 12px;
    margin-right: auto;
  }
  footer button {
    border: 1px solid var(--border);
    background: var(--bg-alt);
    color: var(--fg);
    padding: 7px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  .primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .danger:hover {
    border-color: var(--danger, #d33);
    color: var(--danger, #d33);
  }
</style>
