// GFM table helpers: insert a table skeleton, and reformat every table in the
// document so its columns are padded and aligned (the painful manual part).
// Parse/serialize live in table-model.ts (shared with the visual table editor).
import type { EditorView } from "@codemirror/view";
import { SEPARATOR, parseTableBlock, serializeTable } from "./table-model";

/** Insert an empty 2x1 table at the cursor. */
export function insertTable(view: EditorView): boolean {
  const text = "\n| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n";
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
    scrollIntoView: true,
    userEvent: "input",
  });
  view.focus();
  return true;
}

/** Reformat every GFM table in a Markdown string (pure; used by the editor and
 *  unit-tested directly). Non-table lines are passed through unchanged. */
export function formatTablesText(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const next = lines[i + 1];
    if (lines[i].includes("|") && next !== undefined && SEPARATOR.test(next)) {
      let end = i + 1;
      while (end + 1 < lines.length && lines[end + 1].includes("|") && lines[end + 1].trim() !== "") {
        end++;
      }
      out.push(...serializeTable(parseTableBlock(lines.slice(i, end + 1))));
      i = end + 1;
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out.join("\n");
}

/** Reformat every GFM table in the document (aligned, padded columns). */
export function formatTables(view: EditorView): boolean {
  const text = view.state.doc.toString();
  const formatted = formatTablesText(text);
  if (formatted === text) return false;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: formatted },
    userEvent: "input",
  });
  view.focus();
  return true;
}
