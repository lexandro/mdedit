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

One-time setup before the first signed release:

1. **Generate a signing key pair** (keep the private key secret):
   ```bash
   bun tauri signer generate -w mdedit.key
   ```
2. **Public key** → paste into `src-tauri/tauri.conf.json` at
   `plugins.updater.pubkey` (replaces the placeholder).
3. **Private key + password** → add as GitHub repository secrets
   (Settings → Secrets and variables → Actions):
   - `TAURI_SIGNING_PRIVATE_KEY` — contents of `mdedit.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password you chose
4. **Update endpoint** → in `tauri.conf.json`, set the `plugins.updater.endpoints`
   URL to your repo (`https://github.com/<owner>/mdedit/releases/latest/download/latest.json`).
5. Tag and push: `git tag v0.1.0 && git push --tags`. The workflow builds the
   installer, signs it, generates `latest.json`, and attaches everything to a
   **draft** GitHub Release — review and publish it.

> **Code signing:** without an Authenticode certificate, Windows SmartScreen will
> warn on first run. The Tauri updater signature above is separate from OS code
> signing; add a code-signing certificate later for a warning-free install.

## Project layout

```
src/                 SvelteKit frontend (UI, editor, preview, stores)
src-tauri/           Rust backend (file I/O commands, window, menu, config)
```

## License

[MIT](./LICENSE)
