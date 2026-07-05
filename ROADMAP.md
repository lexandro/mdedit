# mdedit — Roadmap

Where mdedit is headed. This is a living document, not a promise of dates or
ordering set in stone; it captures intent and the reasoning behind it.

## Guiding principles

mdedit is a **lightweight, fast, native Windows Markdown editor**. The original
goal is simple: **open and view (and edit) your own `.md` files quickly**, with a
small binary and no Electron bloat.

It deliberately does **not** try to compete with VS Code, Obsidian, or similar —
it will never match their capabilities and shouldn't try. Features are judged
against "does this help someone quickly work with their own Markdown files?"
rather than "does a power IDE have it?".

Engineering stays as it is today: pure, testable logic in plain `.ts` modules;
thin Svelte/CodeMirror shells; no silent failures; small files. Every new
feature puts its testable core in a pure module first (see `CLAUDE.md`).

---

## Next up (in order)

### 1. Snippets & templates

Insert common Markdown scaffolds and reusable text without typing them by hand.
The exact built-in set still needs to be nailed down; the candidates below are
recorded here so they don't get lost.

- **Built-in snippets (candidate list):**
  - Insert **date / time** (configurable format — ISO, locale-aware).
  - **Frontmatter** scaffold (title / date / tags).
  - Code block with a language, table skeleton (until the table editor lands),
    task list, link reference, footnote, callout/admonition, `<details>` block.
- **Document templates:** "new note", "meeting notes", "daily note" scaffolds,
  chosen when creating a document from a template.
- **User-defined snippets:** keyword → expansion, ideally with placeholders / tab
  stops (a lightweight take on VS Code snippets). Stored as JSON in the store and
  editable in Settings.
- **Trigger UX:** a "Insert snippet…" command with a fuzzy picker (reuse
  `fuzzy.ts` and the emoji-picker pattern), and optionally inline expansion (type
  `/date` + Enter).
- **Pure core:** expansion (placeholder substitution, date formatting) is pure
  logic → pure module + tests; the picker UI stays thin.
- **Open decisions:** built-in set vs. user-defined for v1; placeholder / tab-stop
  syntax; inline trigger vs. picker-only to start.

### 2. Visual table editor

Editing Markdown tables by hand (aligning pipes) is the most painful part of
authoring. Give tables a spreadsheet-like GUI.

- **What it does:** edit table cells in a grid widget instead of raw `|` syntax.
  - Add / remove / reorder rows and columns.
  - Set per-column alignment (left / center / right).
  - Edit cells in place with Tab / arrow-key navigation.
  - **Two-way sync** with the source: opening the editor parses the table at the
    cursor; edits serialize back into the Markdown.
- **Invocation:** cursor inside a table → a "Edit table…" command / toolbar
  button, or an affordance in live mode.
- **Reuse:** `md-tables.ts` already parses / formats / normalizes tables (pure).
  The editor is a Svelte component on top; any new parse/serialize logic (column
  alignment, escaping `\|` inside cells) goes into that pure module with tests.
- **Edge cases:** escaped pipes in cells, inline formatting inside cells, ragged
  / misaligned source tables, very wide tables (horizontal scroll).
- **Open decisions:** modal dialog vs. inline widget in live mode; behavior when
  the selection isn't actually a table.

---

## Planned (after the above)

These stay within the "quickly work with my own files" spirit — they lean on
*open tabs*, *recent files*, and the *current file's folder*, not a persistent
indexed workspace (see Rejected).

### Quick Open

A fuzzy switcher (e.g. `Ctrl+P`) over **open tabs + recent files** — jump to a
file without hunting through the tab bar. Reuses `fuzzy.ts` and the command-
palette pattern; no workspace needed. Optionally also lists sibling `.md` files
in the current document's folder (ad-hoc, no persistent tree).

### Search across open tabs

Extend find beyond the current document to **all open tabs**, with a results list
(file + line + preview) and jump-to-match. A folder-wide grep would be the fuller
form, but that leans toward the rejected workspace concept, so v1 scopes to open
tabs (and maybe recent files).

### Wiki-links `[[…]]`

Support `[[filename]]` and `[[filename#heading]]` links resolved against the
**current file's folder** (ad-hoc, not an indexed vault):

- Autocomplete `[[` from sibling filenames.
- Ctrl-click to open the target (like the existing external-link handling).
- Optional "backlinks-lite": which open / sibling files link here.

Scope note: full backlinks / graph view is vault territory (out of scope). This
stays at "click to jump between my related Markdown files."

---

## Further ideas (worth doing, detailed)

Additional directions beyond the planned items — each fits the lightweight
philosophy and the pure-core architecture.

### Presentation / slides mode

Treat `---` (thematic breaks, or a chosen separator) as slide boundaries and
render the document as a full-screen deck (reveal.js-style) with arrow-key
navigation. Reuses the existing renderer (markdown-it + KaTeX + Mermaid +
highlight.js) per slide. Possible extras: a speaker/overview grid, and exporting
the deck as standalone HTML (ties into export). Read-only presentation of the
current document — no separate slide editor.

### Export expansion

Build on the now-self-contained HTML export (local images are inlined as base64):

- **DOCX export** (via a converter, or pandoc if present) for sharing with
  non-technical people.
- **Custom export CSS / theme** so exported HTML/PDF matches a desired style.
- **Better PDF:** page breaks, margins, optional header/footer, page numbers —
  the current print-based PDF is limited.
- **Copy as RTF** so pasting into Word/email keeps formatting.

### Mermaid / diagram UX

- Pan & zoom for large diagrams in the preview.
- Export a diagram to SVG / PNG (right-click → save).
- Surface Mermaid parse errors inline (a small error box) instead of a silent
  blank.

### Writing-focus features

- **Typewriter scrolling** — keep the active line vertically centered.
- **Focus mode** — dim everything except the current paragraph / sentence.
- **Writing goals / session stats** beyond the status bar (words this session, a
  target).

### Cross-platform (strategic, optional)

Tauri already supports macOS and Linux, so builds there could widen the audience.
This is a *reach* decision, not a feature: it grows the CI/test matrix, needs
guards around Windows-specific code (file association, path handling), and
dilutes the "native Windows" positioning. Low priority given the Windows-first,
"my own files" origin — only if there's real demand.

### Infra: E2E tests for the live-preview / CodeMirror layer

The pure cores are well covered by vitest; the CodeMirror + live-preview
integration is the biggest untested surface. A `tauri-driver` + WebdriverIO smoke
suite (open a doc, toggle view modes, paste an image, edit a table, confirm the
preview updates) would guard against regressions unit tests can't catch.

### Infra: large-file performance

The preview recomputes on each render; on big documents markdown-it + KaTeX +
Mermaid add up. Options: tune the incremental/debounced render, move heavy work
to a worker, or extend the per-block caching that live-preview already does.
Measure first — only worth it if large files are actually opened.

---

## Deferred (cost-gated)

### Code signing (Authenticode)

An Authenticode / Azure Trusted Signing certificate would remove the Windows
SmartScreen warning on first run. **Deferred on purpose:** it costs money, and
mdedit is a free tool that would never recoup it. Revisit only if a free or
near-free signing path appears (a free cert program, or individual signing
pricing dropping to pennies). Until then, first-run users click through
SmartScreen.

---

## Rejected / out of scope

### Folder / workspace mode + file-tree sidebar

A persistent folder sidebar / indexed vault would push mdedit into VS Code /
Obsidian territory. **Explicitly out of scope:** mdedit is a lightweight
viewer/editor for quickly opening your own `.md` files; it will never match
those tools and shouldn't try. The genuinely lightweight slices of this idea
(ad-hoc sibling-folder awareness for Quick Open and wiki-links) are kept in
Planned; the heavy "indexed vault + tree" is not.
