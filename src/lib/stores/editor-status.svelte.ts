// Reactive cursor position of the active editor, shown in the status bar.
class EditorStatus {
  line = $state(1);
  col = $state(1);

  set(line: number, col: number) {
    this.line = line;
    this.col = col;
  }
}

export const editorStatus = new EditorStatus();
