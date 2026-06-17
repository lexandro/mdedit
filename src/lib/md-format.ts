// Pure CodeMirror transforms for Markdown formatting. Used by both the editor
// keymap (Ctrl+B/I/K) and the toolbar buttons (via editor-commands).
import { EditorSelection, type ChangeSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/** Wrap (or unwrap, if already wrapped) each selection with markers. */
export function wrapSelection(view: EditorView, before: string, after = before): boolean {
  const { state } = view;
  const tr = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);
    const wrapped =
      text.length >= before.length + after.length &&
      text.startsWith(before) &&
      text.endsWith(after);
    if (wrapped) {
      const inner = text.slice(before.length, text.length - after.length);
      return {
        changes: { from: range.from, to: range.to, insert: inner },
        range: EditorSelection.range(range.from, range.from + inner.length),
      };
    }
    const insert = before + text + after;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: text.length
        ? EditorSelection.range(range.from + before.length, range.to + before.length)
        : EditorSelection.cursor(range.from + before.length),
    };
  });
  view.dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input" }));
  view.focus();
  return true;
}

/** Insert a Markdown link around the selection, selecting the placeholder URL. */
export function insertLink(view: EditorView): boolean {
  const { state } = view;
  const tr = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);
    const insert = `[${text}](url)`;
    const urlStart = range.from + text.length + 3; // after "[text]("
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(urlStart, urlStart + 3),
    };
  });
  view.dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input" }));
  view.focus();
  return true;
}

/** Add or remove a line prefix (e.g. "# ", "> ", "- ") on the selected lines. */
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view;
  const range = state.selection.main;
  const first = state.doc.lineAt(range.from).number;
  const last = state.doc.lineAt(range.to).number;
  const specs: ChangeSpec[] = [];
  for (let n = first; n <= last; n++) {
    const line = state.doc.line(n);
    if (line.text.startsWith(prefix)) {
      specs.push({ from: line.from, to: line.from + prefix.length, insert: "" });
    } else {
      specs.push({ from: line.from, insert: prefix });
    }
  }
  view.dispatch(state.update({ changes: specs, scrollIntoView: true, userEvent: "input" }));
  view.focus();
  return true;
}
