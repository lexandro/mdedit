// Tab / Shift+Tab in the editor: a thin CodeMirror shell over the pure rules in
// md-indent. CodeMirror's stock `indentWithTab` is line-based, which is why Tab
// used to shove the whole line around instead of typing at the cursor.
import { EditorSelection } from "@codemirror/state";
import type { EditorView, KeyBinding } from "@codemirror/view";
import { indentMore, indentLess } from "@codemirror/commands";
import { tabAction, tabInsert, visualColumn, type IndentStyle } from "$lib/md-indent";

function run(view: EditorView, style: IndentStyle, shift: boolean): boolean {
  const { state } = view;
  const range = state.selection.main;
  const line = state.doc.lineAt(range.from);
  // A selection spanning lines keeps the classic block indent.
  if (range.to > line.to) return shift ? indentLess(view) : indentMore(view);
  // A selection inside one line is replaced by the tab, as in any plain editor;
  // list restructuring is reserved for a bare cursor.
  if (!range.empty) {
    if (shift) return indentLess(view);
    const insert = tabInsert(visualColumn(line.text.slice(0, range.from - line.from)), style);
    view.dispatch({
      changes: { from: range.from, to: range.to, insert },
      selection: { anchor: range.from + insert.length },
      scrollIntoView: true,
      userEvent: "input",
    });
    return true;
  }

  const action = tabAction(
    line.text,
    visualColumn(line.text.slice(0, range.from - line.from)),
    (back) => (line.number - back >= 1 ? state.doc.line(line.number - back).text : null),
    { shift, style },
  );

  switch (action.kind) {
    case "none":
      return true; // swallow Tab: nothing here can be indented sensibly
    case "outdentLine":
      return indentLess(view);
    case "insert":
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: action.text },
        selection: { anchor: range.from + action.text.length },
        scrollIntoView: true,
        userEvent: "input",
      });
      return true;
    case "reindent": {
      const old = /^\s*/.exec(line.text)![0];
      const delta = action.indent.length - old.length;
      view.dispatch({
        changes: { from: line.from, to: line.from + old.length, insert: action.indent },
        // Keep the cursor on the same character; if it sat in the indent, park
        // it at the end of the new one.
        selection: EditorSelection.cursor(
          Math.max(line.from + action.indent.length, range.head + delta),
        ),
        scrollIntoView: true,
        userEvent: "input",
      });
      return true;
    }
  }
}

/** Tab keybindings for the Markdown editor. `style` is read on each press so a
 *  settings change takes effect without reconfiguring the keymap. */
export function mdTabKeymap(style: () => IndentStyle): KeyBinding[] {
  return [
    {
      key: "Tab",
      run: (v) => run(v, style(), false),
      shift: (v) => run(v, style(), true),
    },
  ];
}
