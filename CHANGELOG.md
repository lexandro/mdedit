# Changelog

All notable changes to mdedit are documented here. This project adheres to
[Semantic Versioning](https://semver.org).

## Unreleased

### Fixed

- Anchor jumps in the preview are instant for anyone whose system asks for
  reduced motion, instead of always animating.

## v0.12.0 — 2026-08-14

### Fixed

- **Tab types at the cursor instead of shoving the whole line.** The editor used
  CodeMirror's stock `indentWithTab`, which is line-based: pressing Tab in the
  middle of a line indented the entire line. Tab now inserts at the cursor, up
  to Markdown's 4-column tab stop. Pressing it at the start of a list item still
  indents the item — aligned to the previous sibling's content column ("- " → 2,
  "1. " → 3), which is what CommonMark needs for a real sub-list; Shift+Tab moves
  it back out. Selections behave as before: within one line the selection is
  replaced, across lines the block is indented.

- **Anchor links jump again.** `[How it works](#how-it-works)` did nothing: the
  renderer emitted bare `<h1>`, so there was no target in the document — which
  also made every table of contents the app itself inserts dead on arrival.
  Headings now carry GitHub-style ids (repeats numbered `-1`, `-2`, …), the exact
  slugs the TOC command writes. Clicking an anchor scrolls the preview pane;
  Ctrl+click in Live mode jumps to the heading's line; exported and copied HTML
  carry the ids too. A link that matches no heading now says so instead of
  silently doing nothing.
- **Accented headings keep their letters in anchors.** The slug rule dropped
  every non-ASCII character, so "Áttekintés" became `ttekints` and headings that
  differed only in accents collided. Letters of any script are kept now.

### Added

- **Settings → Editor → Tab key**: choose whether Tab types spaces (default) or a
  real tab character. List indentation always aligns with spaces, since a tab
  cannot land on a 2- or 3-column content boundary.
- **Settings → Editor → Auto-reload changed files**: when a file keeps changing
  on disk, stop answering the same reload prompt over and over — the buffer
  refreshes silently instead. A tab with unsaved edits still asks first, so this
  can never discard your work. Reloading now also keeps the cursor and scroll
  position, which a full-document replace used to reset to the top.

## v0.11.1 — 2026-08-09

### Changed

- **Large documents use far less memory.** A 1 MB file used to cost about
  500 MB, almost all of it the preview: it built the whole document's DOM at
  once and kept every block laid out, even the parts scrolled out of view, and
  every background tab kept its own copy. Offscreen blocks are no longer laid
  out, and only the visible tab's preview is built. Measured on a 1 MB
  document: 888 MB → 691 MB with one tab open, 1498 MB → 918 MB with three.
  Source and Live mode were never affected — they don't build that DOM.
- **Typing in large files no longer re-copies the whole document.** The fold
  gutter re-parsed the entire file for every visible heading, the editor
  flattened the document on every keystroke just to compare it against itself,
  the reopen-closed history kept up to 25 whole documents alive, and Live mode's
  render caches were capped by entry count rather than size and outlived the
  documents they were built for. All four are fixed.
- **Faster startup, much smaller binary** — the launch bundle used to carry
  Mermaid, all ~190 highlight.js grammars and every dialog whether you opened
  one or not, in a single 2.9 MB chunk. Those now load when they are first
  needed, and a background queue warms them up once the window is already on
  screen, so startup never waits on them and the first diagram or HTML paste
  still isn't the slow one. Cold start dropped from ~790 ms to ~665 ms and the
  installed binary from 17.3 MB to 7.4 MB. Memory use is essentially unchanged
  — it is dominated by the WebView2 runtime and the open document, not by the
  bundle.
- **Code highlighting covers 26 common languages** instead of all ~190. A fence
  in a language outside that set renders as plain code, exactly as an
  unrecognised language always did.
- **Only the `.msi` installer is built.** The NSIS `.exe` was produced on every
  release and never published; winget and Chocolatey both install the `.msi`.

### Fixed

- **The recent-files list on the start screen is readable.** File names broke
  mid-word and the path was cut off at the end — the part that tells you which
  file it is. Each entry is now one line: the full path with its middle elided,
  ending in the file name in bold, so you can see both the drive and the folder.
- **No white flash on startup** — the window stayed invisible until the WebView
  had painted, so launching mdedit no longer shows a white rectangle for a
  fraction of a second. The theme is also resolved before the settings file is
  read, so a dark system theme is dark from the very first frame.

## v0.11.0 — 2026-08-04

### Added

- **Open a file that doesn't exist yet** — typing a new name in the Open dialog
  (or launching mdedit with a missing path) no longer just fails: mdedit asks
  whether to create it, so a typo can be corrected and a genuinely new document
  starts right where you wanted it. Files that exist but can't be read still
  report the original error.
- **Document templates** (File → New from Template…, Ctrl+Shift+N) — start a
  new tab pre-filled from a template: built-in *Note*, *Meeting notes* and
  *Daily note* (with the current date filled in), plus any of your own snippets
  marked "Offer as document template" in the snippet manager.
- **User-defined snippets** (Edit → Manage Snippets…) — create your own
  snippets with a name, an inline `/trigger` and a body using the same
  `${field}` tab-stops and `{date}`/`{time}`/`{datetime}` variables as the
  built-ins. They appear in the Ctrl+J picker and the inline `/` completion;
  a user trigger that matches a built-in one replaces it. Stored in
  `snippets.json` next to the other app settings.

## v0.10.0 — 2026-07-06

### Added

- **Visual table editor** (Ctrl+T, Edit menu, toolbar) — edit the Markdown
  table at the cursor in a spreadsheet-like grid instead of aligning pipes by
  hand: in-place cell editing with Tab/arrow navigation, add/remove/reorder
  rows and columns (buttons or Alt+arrows), per-column alignment. With the
  cursor outside a table it opens an empty 2×2 grid and inserts at the cursor;
  saving is a single undo step. Replaces the raw **Insert Table** skeleton.
- **Snippets** — insert common Markdown scaffolds via the fuzzy **Insert
  Snippet…** picker (Ctrl+J) or by typing an inline trigger (`/date`, `/code`,
  `/table`, `/frontmatter`, …). 11 built-ins with tab-stop fields
  (Tab/Shift-Tab jumps between them) and `{date}`/`{time}`/`{datetime}`
  variables; the date format (ISO / locale) is configurable in
  Settings → General.
- **Spell check** (Settings → Editor) — the WebView's native checker underlines
  misspelled words as you type, with a language selector (system default /
  English / Magyar). Off by default.

### Changed

- **Settings dialog** has a fixed size tuned for 1080p displays — it no longer
  resizes when switching tabs.
- **View-menu toggles** (split orientation, outline, word wrap) show their
  current state as a right-aligned hint instead of a checkmark column.

### Fixed

- **Pasted images render reliably** — an untitled-buffer paste whose appdata path
  contains a space, parenthesis, or backslash now shows in Preview and Live
  (paths are encoded/decoded around markdown-it instead of breaking the link).
- **Exported / copied HTML is self-contained** — local images are inlined as
  base64, so they still show in an external browser or another app.
- **UNC image sources are blocked** — a `\\host\share` image path in an untrusted
  document can no longer trigger an outbound SMB/HTTP request from the preview.
- **Escaped pipes survive Format Tables** — a `\|` inside a table cell is no
  longer split into an extra column when tables are reformatted.

## v0.9.0 — 2026-06-21

### Added

- **Paste as Markdown** (Ctrl+Shift+V) — converts rich clipboard HTML to GFM.
- **Section folding** — fold a heading down to the next same-or-higher heading.
- **Insert Table of Contents** — a nested list of links to the document's headings.
- **YAML frontmatter** renders as a styled metadata block in the preview.
- **Format Document** — conservative whole-document Markdown tidy-up.

### Changed

- A new tab (Ctrl+N) or opened file now focuses the editor immediately, so you
  can start typing without clicking the source pane first.

### Fixed

- **Mermaid diagrams** now render reliably in Preview/Split (the render ran
  before the HTML hit the DOM and never retried).

## v0.8.1 — 2026-06-20

### Added

- **Markdown file association** — on Windows, mdedit checks whether it's the
  `.md` handler at startup and, if not, offers to register itself (HKCU, no
  admin). Also available anytime in Settings → General.

### Fixed

- Bold/italic with no selection now wraps the **whole word under the cursor**
  (and toggles off on a second press) instead of inserting bare `****`.

## v0.8.0 — 2026-06-20

### Added

- **Live (WYSIWYG) mode** (Ctrl+4) — inline rendering in the editor: headings,
  bold/italic/code/strikethrough, links (Ctrl-click to open), images, horizontal
  rules, GFM tables, fenced code, Mermaid diagrams, KaTeX math, and clickable
  task checkboxes all render in place, revealing raw Markdown on the active line.
  The document stays plain Markdown, so saving/encoding/sessions are unchanged.
- GFM parsing in the editor (tables, strikethrough, task lists).

### Fixed

- **Bold / italic / inline code now truly toggle off** instead of stacking more
  `**…**` markers each time the button/shortcut is used.

## v0.7.0 — 2026-06-19

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
