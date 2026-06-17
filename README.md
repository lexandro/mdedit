# mdedit

A fast, native Windows **Markdown editor** built with [Tauri 2](https://tauri.app) (Rust) and [Svelte 5](https://svelte.dev). Small binary, native WebView2, no Electron bloat.

## Features

- **Three view modes** — source-only, rendered preview, and split view (with switchable vertical / horizontal orientation)
- **Multi-tab** editing — work on several files at once, with per-tab unsaved-changes tracking
- **Markdown syntax highlighting** in the source editor ([CodeMirror 6](https://codemirror.net))
- **GitHub Flavored Markdown** rendering — tables, task lists, autolinks, fenced code
- **Mermaid diagrams** and **code block syntax highlighting** in the preview
- **Standard editor functions** — New, Open, Save, Save As, Find & Replace
- **Themes** — Dark / Light / System, configurable in settings

> WYSIWYG inline editing (Typora-style) is planned for a later release. The current "rendered" mode is a live preview.

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
