// Thin CodeMirror wrappers around the pure formatting logic in md-format-core.
// Used by the editor keymap (Ctrl+B/I/K) and the toolbar buttons.
import { EditorSelection, type ChangeSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { toggleEmphasis, nextListPrefix } from "$lib/md-format-core";

/** Wrap (or unwrap, if already wrapped) each selection with markers. Detects
 *  markers whether they're inside or just outside the selection, so the toolbar
 *  / Ctrl+B|I buttons truly toggle instead of stacking `**…**`. With no
 *  selection, it operates on the whole word under the cursor. */
export function wrapSelection(view: EditorView, before: string, after = before): boolean {
  const { state } = view;
  const tr = state.changeByRange((range) => {
    // No selection: target the word under the cursor (so "pr|oba" wraps "proba",
    // and pressing again removes it) — falling back to the bare cursor otherwise.
    let { from, to } = range;
    if (from === to) {
      const word = state.wordAt(from);
      if (word) ({ from, to } = word);
    }
    const text = state.sliceDoc(from, to);
    const ctxLeft = state.sliceDoc(Math.max(0, from - before.length - 1), from);
    const ctxRight = state.sliceDoc(to, Math.min(state.doc.length, to + after.length + 1));
    const edit = toggleEmphasis(text, ctxLeft, ctxRight, before, after);
    const eFrom = from + edit.fromDelta;
    const selStart = eFrom + edit.selStart;
    // If we wrapped at a bare cursor (no word, empty text), keep a cursor between
    // the new markers; otherwise select the affected word/selection.
    const placeCursor = range.from === range.to && text.length === 0;
    return {
      changes: { from: eFrom, to: to + edit.toDelta, insert: edit.insert },
      range: placeCursor
        ? EditorSelection.cursor(selStart)
        : EditorSelection.range(selStart, selStart + edit.selLen),
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

/** Enter inside a list continues it (next bullet / incremented number / carried
 *  task box); pressing Enter on an empty item exits the list. Returns false on
 *  non-list lines so the default newline behaviour runs. */
export function continueList(view: EditorView): boolean {
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;
  const line = state.doc.lineAt(range.from);
  const action = nextListPrefix(line.text);
  if (!action) return false;

  if ("exit" in action) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
      userEvent: "input",
    });
    return true;
  }

  const insert = "\n" + action.prefix;
  view.dispatch({
    changes: { from: range.from, to: range.from, insert },
    selection: { anchor: range.from + insert.length },
    scrollIntoView: true,
    userEvent: "input",
  });
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
