# Changelog

All notable changes to mdedit are documented here. This project adheres to
[Semantic Versioning](https://semver.org).

## [Unreleased]

### Added

- **LaTeX math** in the preview via KaTeX — inline `$…$` and display `$$…$$`.
- **Autosave** (off by default) — saves the active saved file after a configurable
  delay; toggled in Settings → Editor.

### Changed

- **Settings dialog** split into General / Appearance / Editor / Preview tabs and
  made scrollable, so it fits in a non-maximized window.
- **View menu** now shows toggle state — checkmarks for Word Wrap and Outline,
  and the current orientation for Split.
- README features section rewritten to reflect the full feature set.

## v0.6.0 — 2026-06-18

### Added

- **GFM extensions** in the preview: footnotes, definition lists, sub/super-script,
  and `:shortcode:` emoji.
- **Auto-close brackets/quotes**, and pasting a URL over a selection turns it
  into a Markdown link.
- **Go to Line** (Ctrl+G, also in the Edit menu).
- **Recent files: pin & clear** — pin files above the list (surviving Clear);
  clear from the empty-state list or File → Open Recent.
- **Tab context menu** (Close / Close Others / Close to the Right / Copy Path /
  Open Containing Folder) and **drag-to-reorder** tabs.
- **Command palette** (Ctrl+Shift+P) — fuzzy search over every command.
- **In-app emoji picker** (Edit → Insert Emoji…, and in the command palette) —
  a reliable replacement for the flaky OS picker.
- **Localization** — full English and Hungarian UI with a Language switch in
  Settings; first run follows the OS language.

### Internal

- jsdom component tests (@testing-library/svelte) alongside the pure-logic suite.

## v0.5.0 — 2026-06-18

### Added

- **Encoding support** — files are read by detected encoding: UTF-8 (+BOM),
  UTF-16 LE/BE, and a **Windows-1250** fallback for legacy (e.g. Hungarian)
  files; the status bar shows it. Saving a Windows-1250 file converts to UTF-8.
- **Smart list continuation** — Enter continues a list/quote (incrementing
  numbers, carrying task boxes); an empty item exits.
- **Ctrl + mouse wheel** zooms the editor font.
- **Alt** shows menu access keys; **Alt+F/E/V/H** opens that menu.
- **Custom right-click menu** in the editor (Cut/Copy/Paste/Select All).
- **Configurable preview render debounce** (Settings → Preview update delay).
- **Word-wrap toggle**, status bar **cursor position** + **reading time**.
- **File menu**: Open Recent, Save All (Ctrl+Alt+S), Reopen Closed Tab (Ctrl+Shift+T).
- **Start maximized** by default, with a Startup window setting.
- **Error toasts** — failed save/open/export/paste now surface a notification
  instead of failing silently.

### Internal

- First unit tests (vitest) for encoding, table formatting, settings math, and
  error formatting; CI runs type-check + tests + build on every push.

## v0.4.0 — 2026-06-17

### Added

- **Table tools** — insert a table and auto-format/align every GFM table in the
  document (Edit menu + toolbar).
- **Clickable task-list checkboxes** — toggling a checkbox in the preview updates
  the `- [ ]`/`- [x]` in the source.
- **Copy as HTML** — copy the rendered document to the clipboard as rich HTML
  (Edit menu).
- **About dialog** (Help → About mdedit) showing the installed version, links,
  and a check-for-updates button.

## v0.3.0 — 2026-06-17

### Added

- **Open files from the OS** — `.md` file association (double-click / "Open
  with"), command-line argument, and **drag & drop** onto the window. A second
  launch reuses the running window (single instance) and focuses it.
- **Formatting toolbar + shortcuts** — bold/italic/code/link/heading/list/quote
  buttons, with **Ctrl+B / Ctrl+I / Ctrl+K** in the editor.
- **Paste images from the clipboard** — saved next to the document (`./images/`)
  and inserted as a relative Markdown image.
- **Export to HTML and PDF** (File menu) — standalone HTML; PDF via the system
  print dialog.
- **Document outline** — a heading panel (View → Toggle Outline); click to jump.

## v0.2.0 — 2026-06-17

### Added

- **In-app menu bar** (File / Edit / View / Help) replacing the native OS menu —
  it matches the theme and scales with the interface size.
- **Interface size (zoom)** setting that enlarges the whole UI, and a separate
  **editor font size** setting — both in Settings, for accessibility.
- **Automatic update checks.** The app checks for updates in the background
  (on launch and periodically) and *offers* an update via a banner; it never
  downloads unattended. A manual check lives under **Help → Check for Updates**.
- **Relative images in the preview.** Image paths like `![](images/foo.png)` now
  resolve against the open document's folder and render via the asset protocol.

### Changed

- Moved the update check out of the (buried) Settings dialog.

## v0.1.1 — 2026-06-17

### Changed

- **Custom app icon.** Replaced the default Tauri logo with mdedit's own icon
  (a blue "MD" document) across the executable, installer, taskbar/title bar,
  the in-app empty screen, and the WebView favicon.

## v0.1.0 — 2026-06-17

First public release — a fast, native Windows Markdown editor built with
Tauri 2 (Rust) and Svelte 5. Small binary, native WebView2, no Electron.

### Features

- **Three view modes** — source, live preview, and split (vertical or
  horizontal, with a draggable divider) and **two-way scroll sync** between
  the editor and the preview.
- **Multi-tab editing** with per-tab unsaved-changes tracking and a
  close-confirmation prompt.
- **Markdown source editor** with syntax highlighting (CodeMirror 6) and
  **Find & Replace** (Ctrl+F).
- **GitHub Flavored Markdown** rendering — tables, task lists, autolinks,
  fenced code — plus **Mermaid diagrams** and **code syntax highlighting**,
  sanitized with DOMPurify under a strict Content Security Policy.
- **Session restore (Notepad++ style)** — reopens your tabs on launch and
  keeps unsaved and never-saved buffers across restarts, so in-progress notes
  survive even an unexpected shutdown.
- **External-change detection** — notices when an open file is edited by
  another program and offers to reload it.
- **Native menu** (File / Edit / View) and keyboard shortcuts; modern toolbar
  icons.
- **Themes** — Dark / Light / System, persisted between sessions.
- **In-app auto-updates** — Settings → Check for updates.

### Install

Download `mdedit_0.1.0_x64-setup.exe` (NSIS) or `mdedit_0.1.0_x64_en-US.msi`
below and run it. Windows x64 only; the WebView2 runtime is required
(preinstalled on Windows 11).

> The app is not yet code-signed, so Windows SmartScreen may warn on first run:
> click **More info → Run anyway**.
