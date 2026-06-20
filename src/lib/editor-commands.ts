// Edit-menu actions that operate on whichever CodeMirror editor is currently
// active. Editor.svelte registers/clears the active view; the menu calls these.
import { EditorView } from "@codemirror/view";
import { undo, redo, selectAll } from "@codemirror/commands";
import { wrapSelection, insertLink, toggleLinePrefix } from "$lib/md-format";
import { insertTable, formatTables } from "$lib/md-tables";
import { htmlToMarkdown } from "$lib/html-to-md";
import { parseHeadings, buildToc } from "$lib/md-headings";

let activeView: EditorView | null = null;

export function setActiveEditor(view: EditorView) {
  activeView = view;
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
    activeView.focus();
    try {
      let html = "";
      for (const item of await navigator.clipboard.read()) {
        if (item.types.includes("text/html")) {
          html = await (await item.getType("text/html")).text();
          break;
        }
      }
      const text = html ? htmlToMarkdown(html) : await navigator.clipboard.readText();
      const { from, to } = activeView.state.selection.main;
      activeView.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
    } catch {
      document.execCommand("paste");
    }
  },
};

/** Insert text at the active editor's cursor, replacing any selection. */
export function insertText(text: string) {
  if (!activeView) return;
  const { from, to } = activeView.state.selection.main;
  activeView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  activeView.focus();
}

/** Insert a Markdown table of contents (links to the document's headings). */
export function insertToc() {
  if (!activeView) return;
  const toc = buildToc(parseHeadings(activeView.state.doc.toString()));
  if (!toc) return; // no headings
  const { from, to } = activeView.state.selection.main;
  const text = toc + "\n";
  activeView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  activeView.focus();
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
