# mdedit

A fast, native Windows **Markdown editor** built with [Tauri 2](https://tauri.app) (Rust) and [Svelte 5](https://svelte.dev). Small binary, native WebView2, no Electron bloat.

## Features

**Editing**

- **Four view modes** — source, rendered preview, split, and a **Live (WYSIWYG)** mode (Ctrl+4) that styles Markdown inline — headings, bold/italic/code, links, images, tables, fenced code, Mermaid, KaTeX math and task checkboxes render in place, revealing raw Markdown only on the line you're editing
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

> Live mode is a CodeMirror-based inline rendering (Obsidian "Live Preview"
> style): the document stays plain Markdown under the hood, so saving, encoding
> and sessions are unaffected, and you can switch back to Source/Split anytime.

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

The workflow builds the installers, signs them, generates `latest.json`,
**publishes** the GitHub Release (no draft), and submits the new version to
winget — all hands-off. Existing installs then see it via Settings →
**Check for updates**. (Prefer a manual review gate? Set `releaseDraft: true`
in `release.yml` and publish the draft yourself.)

To regenerate the key from scratch (only if compromised/lost), repeat
`bun tauri signer generate -w <path> --ci -f`, update the `pubkey` in
`tauri.conf.json`, and reset the `TAURI_SIGNING_PRIVATE_KEY` secret.

> **Code signing:** without an Authenticode certificate, Windows SmartScreen will
> warn on first run. The Tauri updater signature above is separate from OS code
> signing; add a code-signing certificate later for a warning-free install.

## Publishing to winget

The `winget` job in `.github/workflows/release.yml` submits a manifest PR to
[microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) after every
release (it uses the `.msi` asset, so winget gets a ProductCode for clean
upgrade detection). No code-signing certificate is required.

**One-time setup**

1. Create a **classic** GitHub Personal Access Token with the `public_repo`
   scope and add it to this repo as the **`WINGET_TOKEN`** secret
   (Settings → Secrets and variables → Actions). The default `GITHUB_TOKEN`
   can't fork winget-pkgs, so a PAT is required.
2. Submit the **first** version once (the workflow only *updates* an existing
   package). With [wingetcreate](https://github.com/microsoft/winget-create):

   ```powershell
   wingetcreate new `
     https://github.com/lexandro/mdedit/releases/download/v0.9.0/mdedit_0.9.0_x64_en-US.msi `
     --submit --token <your-PAT>
   ```

   Fill the prompted metadata (PackageIdentifier `lexandro.mdedit`, publisher
   `lexandro`, MIT, homepage `https://github.com/lexandro/mdedit`). The first PR
   goes through Microsoft's review; later releases are submitted automatically.

**After that** every release auto-opens a winget update PR — no manual steps.
Install with `winget install lexandro.mdedit`.

## Publishing to Chocolatey

`.github/workflows/choco.yml` packs the `packaging/chocolatey/` package
(downloading the `.msi` and embedding its SHA256) and `choco push`es it to the
community repo automatically after each Release — and can be run manually
(Actions → Chocolatey → Run workflow) to (re)publish a specific version.

**One-time setup:** create a [community.chocolatey.org](https://community.chocolatey.org)
account, generate an **API Key** (account → API Keys), and add it to this repo as
the **`CHOCO_API_KEY`** secret.

Each pushed version goes through **Chocolatey moderation** (automated checks +
review) before it's publicly visible — that part is on Chocolatey's side. The
push itself is automatic; the current version publishes from the next release (or
push once manually with `choco pack`/`choco push`). Install with
`choco install mdedit`.

> The in-app updater and winget are independent: a winget install that later
> self-updates will drift from the winget-tracked version until the next winget
> release. That's expected and harmless.

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
