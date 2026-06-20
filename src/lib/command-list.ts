// User-facing commands for the command palette. `id` maps onto the command
// handlers in +page.svelte (via handleMenu); `key` is the i18n label key.
export interface PaletteCommand {
  id: string;
  key: string;
}

export const paletteCommands: PaletteCommand[] = [
  { id: "new", key: "cmd.new" },
  { id: "open", key: "cmd.open" },
  { id: "save", key: "cmd.save" },
  { id: "save_as", key: "cmd.save_as" },
  { id: "save_all", key: "cmd.save_all" },
  { id: "close_tab", key: "cmd.close_tab" },
  { id: "reopen_closed", key: "cmd.reopen_closed" },
  { id: "export_html", key: "cmd.export_html" },
  { id: "export_pdf", key: "cmd.export_pdf" },
  { id: "copy_html", key: "cmd.copy_html" },
  { id: "clear_recent", key: "cmd.clear_recent" },
  { id: "undo", key: "cmd.undo" },
  { id: "redo", key: "cmd.redo" },
  { id: "cut", key: "cmd.cut" },
  { id: "copy", key: "cmd.copy" },
  { id: "paste", key: "cmd.paste" },
  { id: "paste_as_markdown", key: "cmd.paste_as_markdown" },
  { id: "select_all", key: "cmd.select_all" },
  { id: "goto_line", key: "cmd.goto_line" },
  { id: "insert_table", key: "cmd.insert_table" },
  { id: "insert_toc", key: "cmd.insert_toc" },
  { id: "insert_emoji", key: "cmd.insert_emoji" },
  { id: "format_tables", key: "cmd.format_tables" },
  { id: "format_document", key: "cmd.format_document" },
  { id: "view_source", key: "view.source" },
  { id: "view_split", key: "view.split" },
  { id: "view_preview", key: "view.preview" },
  { id: "view_live", key: "view.live" },
  { id: "toggle_orientation", key: "cmd.toggle_orientation" },
  { id: "toggle_outline", key: "cmd.toggle_outline" },
  { id: "toggle_word_wrap", key: "cmd.toggle_word_wrap" },
  { id: "settings", key: "cmd.settings" },
  { id: "check_updates", key: "cmd.check_updates" },
  { id: "changelog", key: "cmd.changelog" },
  { id: "about", key: "cmd.about" },
];
