// Edit-menu actions that operate on whichever CodeMirror editor is currently
// active. Editor.svelte registers/clears the active view; the menu calls these.
import type { EditorView } from "@codemirror/view";
import { undo, redo, selectAll } from "@codemirror/commands";

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
};
