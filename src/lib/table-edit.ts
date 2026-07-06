// Glue between the active editor and the visual table editor dialog: capture
// the table under the cursor when the dialog opens, write the edited model
// back as a single dispatch (one undo step) when it saves.
import { getActiveView } from "./editor-commands";
import { findTableAt, parseTableBlock, serializeTable, emptyTable, type TableModel } from "./table-model";

export interface TableEditContext {
  /** Table block offsets, or the selection to replace when `isNew`. */
  range: { from: number; to: number };
  model: TableModel;
  isNew: boolean;
}

/** Snapshot for the dialog: the table at the cursor, or a fresh 2x2 model
 *  targeting the current selection. Null when no editor has focus. */
export function getTableEditContext(): TableEditContext | null {
  const view = getActiveView();
  if (!view) return null;
  const { from, to, head } = view.state.selection.main;
  const text = view.state.doc.toString();
  const range = findTableAt(text, head);
  if (!range) return { range: { from, to }, model: emptyTable(2, 2), isNew: true };
  const lines = text.slice(range.from, range.to).split("\n");
  return { range, model: parseTableBlock(lines), isNew: false };
}

/** Serialize the edited model over the captured range. The dialog is modal,
 *  so the document cannot change between capture and save. */
export function applyTableEdit(ctx: TableEditContext, model: TableModel): void {
  const view = getActiveView();
  if (!view) return;
  const block = serializeTable(model).join("\n");
  const insert = ctx.isNew ? `\n${block}\n` : block;
  view.dispatch({
    changes: { from: ctx.range.from, to: ctx.range.to, insert },
    selection: { anchor: ctx.range.from + insert.length },
    scrollIntoView: true,
    userEvent: "input",
  });
  view.focus();
}
