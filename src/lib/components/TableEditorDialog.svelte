<script lang="ts">
  import { tick } from "svelte";
  import { t } from "$lib/i18n";
  import type { Align, TableModel } from "$lib/table-model";
  import { addRow, removeRow, moveRow, addCol, removeCol, moveCol, setAlign } from "$lib/table-ops";
  import { navTarget } from "$lib/table-nav";

  let {
    model: initial,
    onSave,
    onClose,
  }: {
    model: TableModel;
    onSave: (m: TableModel) => void;
    onClose: () => void;
  } = $props();

  // Edit a deep copy; the prop stays untouched until Save hands back a snapshot.
  // svelte-ignore state_referenced_locally -- capturing the opening value is the point
  let model = $state<TableModel>({
    aligns: [...initial.aligns],
    cells: initial.cells.map((r) => [...r]),
  });
  let root: HTMLElement | undefined;

  const rows = $derived(model.cells.length);
  const cols = $derived(model.aligns.length);

  $effect(() => {
    focusCell(0, 0);
  });

  function focusCell(r: number, c: number) {
    root?.querySelector<HTMLInputElement>(`input[data-r="${r}"][data-c="${c}"]`)?.focus();
  }

  /** Apply a structural op and restore focus near (r, c) once the grid re-renders. */
  async function apply(next: TableModel, r: number, c: number) {
    if (next === model) return;
    model = next;
    await tick();
    focusCell(Math.min(r, model.cells.length - 1), Math.min(c, model.aligns.length - 1));
  }

  function save() {
    onSave($state.snapshot(model));
  }

  function onDialogKey(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
  }

  function onCellKey(e: KeyboardEvent, r: number, c: number) {
    const input = e.currentTarget as HTMLInputElement;
    if (e.altKey) {
      if (e.key === "ArrowUp") void apply(moveRow(model, r, r - 1), r - 1, c);
      else if (e.key === "ArrowDown") void apply(moveRow(model, r, r + 1), r + 1, c);
      else if (e.key === "ArrowLeft") void apply(moveCol(model, c, c - 1), r, c - 1);
      else if (e.key === "ArrowRight") void apply(moveCol(model, c, c + 1), r, c + 1);
      else return;
      e.preventDefault();
      return;
    }
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const atEnd =
      input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    const target = navTarget(e.key, e.shiftKey, r, c, rows, cols, atStart, atEnd);
    if (!target) return;
    e.preventDefault();
    if (target === "appendRow") void apply(addRow(model, rows), rows, 0);
    else focusCell(target.r, target.c);
  }
</script>

<div
  class="backdrop"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === "Escape" && onClose()}
></div>
<div
  class="dialog"
  role="dialog"
  aria-modal="true"
  aria-label={t("table.title")}
  tabindex="-1"
  bind:this={root}
  onkeydown={onDialogKey}
>
  <header>{t("table.title")}</header>

  <div class="grid">
    <table>
      <thead>
        <tr>
          <th class="rowctl"></th>
          {#each model.aligns as align, c (c)}
            <th>
              <div class="colctl">
                <select
                  aria-label={t("table.align")}
                  value={align}
                  onchange={(e) => (model = setAlign(model, c, e.currentTarget.value as Align))}
                >
                  <option value="none">{t("table.alignNone")}</option>
                  <option value="left">{t("table.alignLeft")}</option>
                  <option value="center">{t("table.alignCenter")}</option>
                  <option value="right">{t("table.alignRight")}</option>
                </select>
                <button
                  title={t("table.moveLeft")}
                  aria-label={t("table.moveLeft")}
                  disabled={c === 0}
                  onclick={() => apply(moveCol(model, c, c - 1), 0, c - 1)}>←</button
                >
                <button
                  title={t("table.moveRight")}
                  aria-label={t("table.moveRight")}
                  disabled={c === cols - 1}
                  onclick={() => apply(moveCol(model, c, c + 1), 0, c + 1)}>→</button
                >
                <button
                  title={t("table.delCol")}
                  aria-label={t("table.delCol")}
                  disabled={cols === 1}
                  onclick={() => apply(removeCol(model, c), 0, c)}>×</button
                >
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each model.cells as row, r (r)}
          <tr>
            <td class="rowctl">
              {#if r > 0}
                <button
                  title={t("table.moveUp")}
                  aria-label={t("table.moveUp")}
                  disabled={r === 1}
                  onclick={() => apply(moveRow(model, r, r - 1), r - 1, 0)}>↑</button
                >
                <button
                  title={t("table.moveDown")}
                  aria-label={t("table.moveDown")}
                  disabled={r === rows - 1}
                  onclick={() => apply(moveRow(model, r, r + 1), r + 1, 0)}>↓</button
                >
                <button
                  title={t("table.delRow")}
                  aria-label={t("table.delRow")}
                  onclick={() => apply(removeRow(model, r), r, 0)}>×</button
                >
              {/if}
            </td>
            {#each row as cell, c (c)}
              <td>
                <input
                  class:head={r === 0}
                  data-r={r}
                  data-c={c}
                  bind:value={model.cells[r][c]}
                  onkeydown={(e) => onCellKey(e, r, c)}
                />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <footer>
    <button onclick={() => apply(addRow(model, rows), rows, 0)}>+ {t("table.addRow")}</button>
    <button onclick={() => apply(addCol(model, cols), 0, cols)}>+ {t("table.addCol")}</button>
    <span class="spacer"></span>
    <button onclick={onClose}>{t("table.cancel")}</button>
    <button class="primary" onclick={save}>{t("table.save")}</button>
  </footer>
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
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 11;
    display: flex;
    flex-direction: column;
    width: min(900px, 94vw);
    height: min(600px, 85vh);
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
  header {
    padding: 12px 16px;
    font-weight: 600;
    border-bottom: 1px solid var(--border);
  }
  .grid {
    flex: 1;
    overflow: auto;
    padding: 12px 16px;
  }
  table {
    border-collapse: collapse;
  }
  td,
  th {
    padding: 2px;
  }
  td:not(.rowctl) {
    border: 1px solid var(--border);
  }
  .rowctl {
    white-space: nowrap;
    width: 1%;
    padding-right: 6px;
  }
  .colctl {
    display: flex;
    gap: 2px;
    align-items: center;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    min-width: 130px;
    background: transparent;
    color: var(--fg);
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 5px 8px;
    font: inherit;
    font-size: 13px;
  }
  input.head {
    font-weight: 600;
    background: var(--bg-alt);
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
    background: var(--bg-alt);
  }
  select {
    flex: 1;
    background: var(--bg-alt);
    color: var(--fg-muted);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 12px;
  }
  button {
    background: var(--bg-alt);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 12px;
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    border-color: var(--accent);
  }
  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  footer {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
  }
  footer button {
    padding: 6px 14px;
    font-size: 13px;
  }
  .spacer {
    flex: 1;
  }
  .primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
</style>
