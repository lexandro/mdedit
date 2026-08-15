<script lang="ts">
  // Thin shell over the confirm store: it renders whatever request is pending
  // and hands the answer back. Mounted for the whole app session (see
  // +page.svelte) because a request can arrive at any moment.
  import { confirmDialog } from "$lib/stores/confirm.svelte";
  import Icon from "$lib/components/Icon.svelte";

  let checked = $state(false);
  let acceptBtn = $state<HTMLButtonElement | undefined>();

  // Every request starts with the option unticked and the confirm button
  // focused, no matter how the previous one was answered.
  $effect(() => {
    if (!confirmDialog.current) return;
    checked = false;
    acceptBtn?.focus();
  });

  const accept = () => confirmDialog.answer({ confirmed: true, checked });
  const cancel = () => confirmDialog.cancel();

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") cancel();
    else if (e.key === "Enter") accept();
    else return;
    e.preventDefault();
  }
</script>

{#if confirmDialog.current}
  {@const req = confirmDialog.current}
  <div
    class="backdrop"
    role="button"
    tabindex="-1"
    aria-label={req.cancelLabel}
    onclick={cancel}
    onkeydown={onKey}
  ></div>
  <div
    class="dialog"
    role="alertdialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-msg"
    onkeydown={onKey}
  >
    <div class="head">
      <span class="glyph"><Icon name="alert" size={18} /></span>
      <h2 id="confirm-title">{req.title}</h2>
    </div>

    <p class="msg" id="confirm-msg">{req.message}</p>

    {#if req.optionLabel}
      <label class="option">
        <input type="checkbox" bind:checked />
        <span>{req.optionLabel}</span>
      </label>
    {/if}

    <footer>
      <button onclick={cancel}>{req.cancelLabel}</button>
      <button class="primary" bind:this={acceptBtn} onclick={accept}>{req.confirmLabel}</button>
    </footer>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.38);
    backdrop-filter: blur(2px);
    border: none;
    z-index: 20;
  }
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 21;
    display: flex;
    flex-direction: column;
    gap: 14px;
    /* Fixed width so the prompt never reflows around the file name it quotes. */
    width: 460px;
    max-width: 92vw;
    padding: 20px 22px 16px;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
    animation: pop 120ms ease-out;
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-50% + 6px));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dialog {
      animation: none;
    }
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .glyph {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--bg-alt);
    color: var(--accent);
  }
  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .msg {
    margin: 0;
    min-height: 3em; /* one- and two-line messages sit at the same height */
    font-size: 13.5px;
    line-height: 1.5;
    white-space: pre-line;
  }
  .option {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 12px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 12.5px;
    color: var(--fg-muted);
    cursor: pointer;
  }
  .option:hover {
    border-color: var(--accent);
    color: var(--fg);
  }
  .option input {
    width: 15px;
    height: 15px;
    margin: 0;
    accent-color: var(--accent);
    cursor: pointer;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  button {
    padding: 7px 16px;
    background: var(--bg-alt);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  button:hover {
    border-color: var(--accent);
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-fg);
  }
  .primary:hover {
    filter: brightness(1.1);
  }
</style>
