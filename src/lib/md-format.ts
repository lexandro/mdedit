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

const LIST_RE = /^(\s*)([-*+]|\d+[.)])(\s+)(\[[ xX]\]\s+)?(.*)$/;

/** Enter inside a list continues it (next bullet / incremented number / carried
 *  task box); pressing Enter on an empty item exits the list. Returns false on
 *  non-list lines so the default newline behaviour runs. */
export function continueList(view: EditorView): boolean {
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;
  const line = state.doc.lineAt(range.from);
  const m = line.text.match(LIST_RE);
  if (!m) return false;
  const [, indent, marker, space, checkbox, content] = m;

  // Empty item -> exit the list (clear the line).
  if (content.trim() === "") {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
      userEvent: "input",
    });
    return true;
  }

  // Continue: build the next marker (bump the number for ordered lists).
  let nextMarker = marker;
  if (/^\d+[.)]$/.test(marker)) {
    nextMarker = `${parseInt(marker, 10) + 1}${marker.slice(-1)}`;
  }
  const insert = "\n" + indent + nextMarker + space + (checkbox ? "[ ] " : "");
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
