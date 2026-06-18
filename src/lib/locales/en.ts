// English UI strings. Keys are shared across locales; {name}-style placeholders
// are filled by t(key, params).
export const en: Record<string, string> = {
  // Menus
  "menu.file": "File",
  "menu.edit": "Edit",
  "menu.view": "View",
  "menu.help": "Help",
  "menu.openRecent": "Open Recent",
  "menu.noRecent": "(no recent files)",

  // Commands (menu items + command palette)
  "cmd.new": "New",
  "cmd.open": "Open…",
  "cmd.save": "Save",
  "cmd.save_as": "Save As…",
  "cmd.save_all": "Save All",
  "cmd.export_html": "Export HTML…",
  "cmd.export_pdf": "Export to PDF…",
  "cmd.close_tab": "Close Tab",
  "cmd.reopen_closed": "Reopen Closed Tab",
  "cmd.quit": "Exit",
  "cmd.clear_recent": "Clear Recent",
  "cmd.undo": "Undo",
  "cmd.redo": "Redo",
  "cmd.cut": "Cut",
  "cmd.copy": "Copy",
  "cmd.paste": "Paste",
  "cmd.select_all": "Select All",
  "cmd.goto_line": "Go to Line…",
  "cmd.insert_table": "Insert Table",
  "cmd.insert_emoji": "Insert Emoji…",
  "cmd.format_tables": "Format Tables",
  "cmd.copy_html": "Copy as HTML",
  "cmd.toggle_orientation": "Toggle Split Orientation",
  "cmd.toggle_outline": "Toggle Outline",
  "cmd.toggle_word_wrap": "Toggle Word Wrap",
  "cmd.settings": "Settings…",
  "cmd.check_updates": "Check for Updates…",
  "cmd.changelog": "Changelog",
  "cmd.about": "About mdedit",

  // View modes (toolbar + menu + palette)
  "view.source": "Source",
  "view.split": "Split",
  "view.preview": "Preview",

  // Toolbar tooltips
  "tip.new": "New (Ctrl+N)",
  "tip.open": "Open (Ctrl+O)",
  "tip.save": "Save (Ctrl+S)",
  "tip.save_as": "Save As (Ctrl+Shift+S)",
  "tip.bold": "Bold (Ctrl+B)",
  "tip.italic": "Italic (Ctrl+I)",
  "tip.code": "Inline code",
  "tip.link": "Link (Ctrl+K)",
  "tip.heading": "Heading",
  "tip.bullet": "Bulleted list",
  "tip.quote": "Quote",
  "tip.table": "Insert table",
  "tip.toggle_orientation": "Toggle split orientation",
  "tip.settings": "Settings",
  "tip.formatting": "Formatting",
  "tip.viewMode": "View mode",

  // Status bar
  "status.modified": "● Modified",
  "status.saved": "Saved",
  "status.toggleEnding": "Toggle line ending",
  "status.lncol": "Ln {line}, Col {col}",
  "status.words": "{n} words",
  "status.chars": "{n} chars",
  "status.read": "~{n} min read",

  // Empty state
  "empty.noFile": "No file open.",
  "empty.new": "New file",
  "empty.open": "Open file…",
  "empty.recent": "Recent",
  "empty.clear": "Clear",
  "empty.pin": "Pin",
  "empty.unpin": "Unpin",
  "empty.hint": "Ctrl+N new · Ctrl+O open · Ctrl+S save · Ctrl+1/2/3 view mode",

  // Settings dialog
  "settings.title": "Settings",
  "settings.close": "Close",
  "settings.theme": "Theme",
  "settings.uiSize": "Interface size",
  "settings.uiSizeHint": "Scales the whole interface — menu, toolbar, tabs, editor and preview.",
  "settings.fontSize": "Editor font size",
  "settings.previewDelay": "Preview update delay",
  "settings.previewDelayHint": "How long after you stop typing the preview re-renders (0 = instant).",
  "settings.defaultView": "Default view mode",
  "settings.splitOrientation": "Split orientation",
  "settings.startup": "Startup window",
  "settings.maximized": "Maximized",
  "settings.normal": "Normal",
  "settings.reset": "Reset",
  "settings.language": "Language",
  "settings.decUi": "Decrease interface size",
  "settings.incUi": "Increase interface size",
  "settings.decFont": "Decrease editor font size",
  "settings.incFont": "Increase editor font size",
  "settings.decDelay": "Decrease preview delay",
  "settings.incDelay": "Increase preview delay",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "orientation.vertical": "Vertical",
  "orientation.horizontal": "Horizontal",

  // About dialog
  "about.version": "Version {v}",
  "about.tagline": "A fast, native Windows Markdown editor — Tauri 2 + Svelte.",
  "about.repo": "GitHub repository",
  "about.releases": "Releases",
  "about.license": "License (MIT)",
  "about.check": "Check for updates",
  "about.copyright": "© 2026 lexandro · MIT License",

  // Changelog
  "changelog.title": "Changelog",

  // Outline
  "outline.title": "Outline",
  "outline.empty": "No headings",

  // Command palette
  "palette.placeholder": "Type a command…",
  "palette.empty": "No matching command",

  // Emoji picker
  "emoji.placeholder": "Search emoji (e.g. smile, heart)…",
  "emoji.empty": "No emoji found",

  // Go to line
  "goto.title": "Go to line",
  "goto.placeholder": "Line number",

  // Tab context menu
  "tab.close": "Close",
  "tab.closeOthers": "Close Others",
  "tab.closeRight": "Close to the Right",
  "tab.copyPath": "Copy Path",
  "tab.reveal": "Open Containing Folder",

  // Updater
  "update.checking": "Checking for updates…",
  "update.downloading": "Downloading and installing {v}…",
  "update.uptodate": "You're up to date.",
  "update.error": "Update check failed: {msg}",
  "update.available": "Update available —",
  "update.install": "Install & restart",
  "update.later": "Later",

  // Toasts
  "toast.exportedHtml": "Exported HTML",
  "toast.exportHtmlFail": "HTML export failed",
  "toast.copiedHtml": "Copied as HTML",
  "toast.copiedHtmlPlain": "Copied as HTML (plain text)",
  "toast.copyFail": "Copy failed",
  "toast.pdfFail": "PDF export failed",
  "toast.openFail": "Couldn't open file",
  "toast.openFailName": "Couldn't open {name}",
  "toast.saveFailName": "Couldn't save {name}",
  "toast.pathCopied": "Path copied",
  "toast.copyPathFail": "Couldn't copy path",
  "toast.pasteImageFail": "Couldn't save pasted image",

  // Accessibility (screen-reader labels)
  "a11y.notifications": "Notifications",
  "a11y.dismiss": "Dismiss",

  // Confirm dialogs
  "confirm.fileChangedTitle": "File changed on disk",
  "confirm.unsavedTitle": "Unsaved changes",
  "confirm.reloadDiscard":
    '"{name}" was modified by another program.\nReload and discard your unsaved changes?',
  "confirm.reload": '"{name}" was modified by another program.\nReload it?',
  "confirm.discard": 'Discard unsaved changes to "{name}"?',
};
