// User-facing commands for the command palette. The id maps onto the command
// handlers in +page.svelte (dispatched via handleMenu).
export interface PaletteCommand {
  id: string;
  label: string;
}

export const paletteCommands: PaletteCommand[] = [
  { id: "new", label: "New File" },
  { id: "open", label: "Open File…" },
  { id: "save", label: "Save" },
  { id: "save_as", label: "Save As…" },
  { id: "save_all", label: "Save All" },
  { id: "close_tab", label: "Close Tab" },
  { id: "reopen_closed", label: "Reopen Closed Tab" },
  { id: "export_html", label: "Export HTML…" },
  { id: "export_pdf", label: "Export to PDF…" },
  { id: "copy_html", label: "Copy as HTML" },
  { id: "clear_recent", label: "Clear Recent Files" },
  { id: "undo", label: "Undo" },
  { id: "redo", label: "Redo" },
  { id: "cut", label: "Cut" },
  { id: "copy", label: "Copy" },
  { id: "paste", label: "Paste" },
  { id: "select_all", label: "Select All" },
  { id: "goto_line", label: "Go to Line…" },
  { id: "insert_table", label: "Insert Table" },
  { id: "insert_emoji", label: "Insert Emoji…" },
  { id: "format_tables", label: "Format Tables" },
  { id: "view_source", label: "View: Source" },
  { id: "view_split", label: "View: Split" },
  { id: "view_preview", label: "View: Preview" },
  { id: "toggle_orientation", label: "Toggle Split Orientation" },
  { id: "toggle_outline", label: "Toggle Outline" },
  { id: "toggle_word_wrap", label: "Toggle Word Wrap" },
  { id: "settings", label: "Settings…" },
  { id: "check_updates", label: "Check for Updates…" },
  { id: "changelog", label: "Changelog" },
  { id: "about", label: "About mdedit" },
];
