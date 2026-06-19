# mdedit

A fast, native Windows **Markdown editor** built with [Tauri 2](https://tauri.app) (Rust) and [Svelte 5](https://svelte.dev). Small binary, native WebView2, no Electron bloat.

## Features

**Editing**

- **Three view modes** — source, rendered preview, and split (switchable vertical / horizontal, with the current orientation shown in the View menu)
- **Multi-tab** editing — drag to reorder, right-click for Close / Close Others / Close to the Right / Copy Path / Open Containing Folder, **Reopen Closed Tab**, and full **session restore** on restart
- **CodeMirror 6** source editor — Markdown syntax highlighting, **auto-closing** brackets/quotes, smart list continuation, **Find & Replace** (Ctrl+F), word-wrap toggle, and font zoom (Ctrl + wheel or Ctrl +/−/0)
- **Optional autosave** with a configurable delay (off by default)

**Rendering**

- **GitHub Flavored Markdown** — tables, task lists, autolinks, fenced code
- **Extensions** — footnotes, definition lists, sub/superscript, and `:shortcode:` **emoji**
- **LaTeX math** via [KaTeX](https://katex.org) — inline `$…$` and display `$$…$$`
- **Mermaid diagrams** and **code block syntax highlighting** (highlight.js)

**Productivity**

- **Command palette** (Ctrl+Shift+P) — fuzzy search over every command
- **In-app emoji picker** (Edit → Insert Emoji…) and **Go to Line** (Ctrl+G)
- **Document outline**, and **Recent files** with pin & clear
- **Export to HTML / PDF**, and **Copy as HTML**

**Files & UI**

- **Encoding-aware** I/O — UTF-8 (+BOM), UTF-16 LE/BE, and a **Windows-1250** fallback; line-ending toggle (LF/CRLF)
- **Paste images** from the clipboard (saved next to the document) and **drag-and-drop** files to open
- **Themes** (Dark / Light / System), interface zoom, and **localized UI** (English / Hungarian)
- **Auto-updater**, error toasts, and a status bar with cursor position, word/character count and reading time

> WYSIWYG inline editing (Typora-style) is planned for a later release. The current "rendered" mode is a live preview.

## Screenshots

| Split view | Command palette |
|---|---|
| ![Split view](docs/screenshots/split.png) | ![Command palette](docs/screenshots/palette.png) |

| Math & diagrams | Settings |
|---|---|
| ![Math and Mermaid](docs/screenshots/math.png) | ![Settings](docs/screenshots/settings.png) |

## Tech stack

| Layer | Choice |
|---|---|
| Shell | Tauri 2 (Rust) + WebView2 |
| Frontend | Svelte 5 + SvelteKit (SPA) + Vite + TypeScript |
| Source editor | CodeMirror 6 |
| Rendering | markdown-it + Mermaid + highlight.js, sanitized with DOMPurify |

## Prerequisites

- [Bun](https://bun.sh) (package manager / scripts)
- [Rust](https://rustup.rs) (stable toolchain)
- Windows 10/11 with **WebView2** runtime (preinstalled on Windows 11)
- See the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for the full list (Microsoft C++ Build Tools)

## Development

```bash
bun install          # install frontend dependencies
bun run tauri dev    # launch the app in dev mode (hot reload)
```

## Build

```bash
bun run tauri build  # produces a native installer + .exe under src-tauri/target/release
```

## Releasing & auto-updates

Releases are built by `.github/workflows/release.yml` when you push a version
tag (e.g. `v0.1.0`). The app also has an in-app updater (Settings → **Check for
updates**) backed by `tauri-plugin-updater`.

Signing is already configured for this repo:

- Key pair generated with `bun tauri signer generate` (no password). The private
  key is stored **outside the repo** at `E:\Mega\keys\mdedit\mdedit.key`
  (`.pub` alongside it) — **keep a backup; if lost, updates can't be signed**.
- The **public key** is committed in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`).
- The **private key** is set as the `TAURI_SIGNING_PRIVATE_KEY` GitHub Actions secret.
  No password secret is needed (the key has none — a missing secret resolves to empty).
- The updater **endpoint** points at this repo's latest release `latest.json`.

To cut a release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds the installer, signs it, generates `latest.json`, and
attaches everything to a **draft** GitHub Release — review and publish it. Once
published, existing installs see it via Settings → **Check for updates**.

To regenerate the key from scratch (only if compromised/lost), repeat
`bun tauri signer generate -w <path> --ci -f`, update the `pubkey` in
`tauri.conf.json`, and reset the `TAURI_SIGNING_PRIVATE_KEY` secret.

> **Code signing:** without an Authenticode certificate, Windows SmartScreen will
> warn on first run. The Tauri updater signature above is separate from OS code
> signing; add a code-signing certificate later for a warning-free install.

## Security

Rendered Markdown is untrusted input, so the preview is defended in depth:

1. `markdown-it` runs with `html: false` (raw HTML in the source is escaped).
2. The rendered HTML is sanitized with **DOMPurify** before insertion.
3. A strict **Content Security Policy** is enforced on the WebView
   (`src-tauri/tauri.conf.json` → `app.security.csp`):
   - `script-src 'self'` — no inline/injected scripts (Tauri auto-hashes the
     app's own bootstrap script); `object-src 'none'`, `base-uri 'self'`.
   - `style-src 'self' 'unsafe-inline'` — required because CodeMirror and Mermaid
     inject styles at runtime (styles can't execute code, so this is low-risk).
   - `img-src` also allows `https:` and `data:` so remote/inline preview images load.
   - A looser `devCsp` (adds `'unsafe-inline' 'unsafe-eval'` + `ws:`/`http:` localhost)
     is used **only** under `tauri dev` for Vite HMR; it never ships.

> The updater's network requests run in Rust (reqwest), so they are not subject
> to the WebView CSP — `connect-src` only needs `ipc:`.

> **If Mermaid diagrams ever fail to render in a production build** with a CSP
> error about `eval`, add `'wasm-unsafe-eval'` (or, as a last resort,
> `'unsafe-eval'`) to `script-src` in the production `csp`. Current Mermaid (v11)
> is expected to work without it.

## Project layout

```
src/                 SvelteKit frontend (UI, editor, preview, stores)
src-tauri/           Rust backend (file I/O commands, window, menu, config)
```

## License

[MIT](./LICENSE)
