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

## Project layout

```
src/                 SvelteKit frontend (UI, editor, preview, stores)
src-tauri/           Rust backend (file I/O commands, window, menu, config)
```

## License

[MIT](./LICENSE)
