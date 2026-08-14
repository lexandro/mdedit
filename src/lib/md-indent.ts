// Tab / Shift+Tab rules for Markdown as plain string logic (no CodeMirror), so
// they are unit-testable. The editor shell lives in editor/md-tab.ts.
//
// CommonMark expands a tab to a 4-column tab stop, and an indented code block
// begins 4 columns past the enclosing block. A sub-list must therefore align to
// its parent item's *content column* ("- " → 2, "1. " → 3) rather than to a
// fixed multiple of 4 — indenting further would turn the item into code.
import { parseListLine } from "$lib/md-format-core";

export type IndentStyle = "spaces" | "tab";

export const TAB_STOP = 4;

/** Visual column reached after `text`, expanding tabs to the next tab stop. */
export function visualColumn(text: string): number {
  let col = 0;
  for (const ch of text) col = ch === "\t" ? col + TAB_STOP - (col % TAB_STOP) : col + 1;
  return col;
}

/** The whitespace a Tab press inserts at visual column `col`. */
export function tabInsert(col: number, style: IndentStyle): string {
  return style === "tab" ? "\t" : " ".repeat(TAB_STOP - (col % TAB_STOP));
}

export type TabAction =
  | { kind: "insert"; text: string } // insert at the cursor
  | { kind: "reindent"; indent: string } // replace the line's leading whitespace
  | { kind: "outdentLine" } // hand over to the editor's block outdent
  | { kind: "none" };

interface ListCols {
  indentCol: number;
  contentCol: number;
}

function listCols(line: string): ListCols | null {
  const li = parseListLine(line);
  if (!li) return null;
  // The checkbox is content, not part of the marker: a sub-list under
  // "- [ ] task" still aligns to column 2.
  return {
    indentCol: visualColumn(li.indent),
    contentCol: visualColumn(li.indent + li.marker + li.gap),
  };
}

/** The new leading indent for moving a list item one level in/out, or null when
 *  there is no valid target (first item of its list / already at column 0).
 *  Always spaces: a tab jumps 4 columns and cannot hit a 2- or 3-column content
 *  alignment, which would render the item as an indented code block. */
function listReindent(
  cur: ListCols,
  prevLine: (back: number) => string | null,
  shift: boolean,
): string | null {
  let blank = 0;
  for (let back = 1; ; back++) {
    const text = prevLine(back);
    if (text === null) break;
    if (text.trim() === "") {
      if (++blank > 1) break; // two blank lines end the list
      continue;
    }
    blank = 0;
    const cols = listCols(text);
    if (!cols) break; // a non-list line ends the list
    if (shift) {
      if (cols.indentCol < cur.indentCol) return " ".repeat(cols.indentCol);
    } else if (cols.indentCol === cur.indentCol) {
      return " ".repeat(cols.contentCol); // nest under the previous sibling
    } else if (cols.indentCol < cur.indentCol) {
      return null; // already nested; no sibling at this level to nest under
    }
  }
  return shift && cur.indentCol > 0 ? "" : null;
}

/**
 * Decide what Tab (or Shift+Tab) should do with the cursor at visual column
 * `col` of `line`. `prevLine(1)` is the line above, `prevLine(2)` the one before
 * that, and so on; null past the start of the document.
 */
export function tabAction(
  line: string,
  col: number,
  prevLine: (back: number) => string | null,
  opts: { shift: boolean; style: IndentStyle },
): TabAction {
  const cols = listCols(line);
  // On a list line Tab restructures the item only while the cursor is still in
  // the marker area — inside the text it must insert, like any plain editor.
  // Shift+Tab is always structural: there is nothing to insert backwards.
  if (cols && (opts.shift || col <= cols.contentCol)) {
    const indent = listReindent(cols, prevLine, opts.shift);
    return indent === null ? { kind: "none" } : { kind: "reindent", indent };
  }
  if (opts.shift) return { kind: "outdentLine" };
  return { kind: "insert", text: tabInsert(col, opts.style) };
}
