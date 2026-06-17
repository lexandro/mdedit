# Changelog

All notable changes to mdedit are documented here. This project adheres to
[Semantic Versioning](https://semver.org).

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
