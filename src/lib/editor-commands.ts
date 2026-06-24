// Edit-menu actions that operate on whichever CodeMirror editor is currently
// active. Editor.svelte registers/clears the active view; the menu calls these.
import { EditorView } from "@codemirror/view";
import { type ChangeSpec } from "@codemirror/state";
import { undo, redo, selectAll } from "@codemirror/commands";
import { wrapSelection, insertLink, toggleLinePrefix } from "$lib/md-format";
import { insertTable, formatTables } from "$lib/md-tables";
import { htmlToMarkdown } from "$lib/html-to-md";
import { parseHeadings, buildToc } from "$lib/md-headings";
import { formatMarkdown } from "$lib/md-prettify";

let activeView: EditorView | null = null;

export function setActiveEditor(view: EditorView) {
  activeView = view;
}

/** Apply a change to the active editor, set the cursor and refocus. */
function applyEdit(changes: ChangeSpec, anchor: number) {
  if (!activeView) return;
  activeView.dispatch({ changes, selection: { anchor } });
  activeView.focus();
}

export function clearActiveEditor(view: EditorView) {
  if (activeView === view) activeView = null;
}

export const editorCommands = {
  undo() {
    if (activeView) {
      undo(activeView);
      activeView.focus();
    }
  },
  redo() {
    if (activeView) {
      redo(activeView);
      activeView.focus();
    }
  },
  selectAll() {
    if (activeView) {
      selectAll(activeView);
      activeView.focus();
    }
  },
  cut() {
    activeView?.focus();
    document.execCommand("cut");
  },
  copy() {
    activeView?.focus();
    document.execCommand("copy");
  },
  async paste() {
    if (!activeView) return;
    activeView.focus();
    try {
      const text = await navigator.clipboard.readText();
      const { from, to } = activeView.state.selection.main;
      activeView.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
    } catch {
      document.execCommand("paste"); // fallback if clipboard read is blocked
    }
  },
  /** Paste clipboard HTML converted to Markdown (falls back to plain text). */
  async pasteAsMarkdown() {
    if (!activeView) return;
    try {
      let html = "";
      for (const item of await navigator.clipboard.read()) {
        if (item.types.includes("text/html")) {
          html = await (await item.getType("text/html")).text();
          break;
        }
      }
      insertText(html ? htmlToMarkdown(html) : await navigator.clipboard.readText());
    } catch {
      document.execCommand("paste");
    }
  },
};

/** Insert text at the active editor's cursor, replacing any selection. */
export function insertText(text: string) {
  if (!activeView) return;
  const { from, to } = activeView.state.selection.main;
  applyEdit({ from, to, insert: text }, from + text.length);
}

/** Tidy the whole document (whitespace, blank lines, bullet markers). */
export function formatDocument() {
  if (!activeView) return;
  const src = activeView.state.doc.toString();
  const out = formatMarkdown(src);
  if (out === src) return;
  const anchor = Math.min(activeView.state.selection.main.anchor, out.length);
  applyEdit({ from: 0, to: activeView.state.doc.length, insert: out }, anchor);
}

/** Insert a Markdown table of contents (links to the document's headings). */
export function insertToc() {
  if (!activeView) return;
  const toc = buildToc(parseHeadings(activeView.state.doc.toString()));
  if (!toc) return; // no headings
  const { from, to } = activeView.state.selection.main;
  const text = toc + "\n";
  applyEdit({ from, to, insert: text }, from + text.length);
}

/** Move the active editor's cursor to a 1-based line and scroll it into view. */
export function goToLine(line: number) {
  if (!activeView) return;
  const doc = activeView.state.doc;
  if (line < 1 || line > doc.lines) return;
  const pos = doc.line(line).from;
  activeView.dispatch({
    selection: { anchor: pos },
    effects: EditorView.scrollIntoView(pos, { y: "start", yMargin: 40 }),
  });
  activeView.focus();
}

/** Markdown formatting actions applied to the active editor (toolbar buttons). */
export const formatCommands = {
  bold: () => activeView && wrapSelection(activeView, "**"),
  italic: () => activeView && wrapSelection(activeView, "*"),
  code: () => activeView && wrapSelection(activeView, "`"),
  link: () => activeView && insertLink(activeView),
  heading: () => activeView && toggleLinePrefix(activeView, "# "),
  bullet: () => activeView && toggleLinePrefix(activeView, "- "),
  quote: () => activeView && toggleLinePrefix(activeView, "> "),
  table: () => activeView && insertTable(activeView),
  formatTables: () => activeView && formatTables(activeView),
};
