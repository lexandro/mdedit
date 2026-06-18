# mdedit — engineering guide

Native Windows Markdown editor. **Tauri 2** (Rust) + **SvelteKit SPA** + **Svelte 5
runes** + **TypeScript (strict)**. Package manager: **bun**. Tests: **vitest**.
CI runs type-check + tests + build on every push (`.github/workflows/ci.yml`);
tags `v*` build signed installers (`release.yml`).

This codebase is maintained by an AI, not a human team. Optimize for
**token-efficiency, clear structure, and testability** over prose/ceremony.

## Architecture (follow these patterns)

- **Pure logic lives in plain `.ts` modules** (no Tauri / CodeMirror / Svelte
  imports) so it is unit-testable in Node: `encoding`, `md-format-core`,
  `md-tables`, `md-tasks`, `md-assets`, `session-util`, `settings-util`,
  `menu-util`, `errors`. `.svelte` components and `*.svelte.ts` rune stores are
  **thin shells** that call these. When adding logic, put the testable core in a
  pure module first.
- **`src/lib/ipc.ts` is the only file that imports Tauri fs/dialog plugins.**
  Everything else goes through its wrappers. Binary IO + encoding flow through
  `encoding.ts`.
- **Stores** are `src/lib/stores/*.svelte.ts` classes using runes; persistence
  goes through `stores/persist.ts` `tryLoadStore` (returns null off-Tauri).
- **Commands**: the `commands` record in `+page.svelte` is the single source of
  truth for menu + keyboard actions. Menu items / shortcuts dispatch by id; do
  not duplicate action bodies.
- **Errors never fail silently** — wrap risky ops (save/open/export/paste) in
  try/catch and report via `stores/toasts` (`toasts.error(msg, cause)`).
  `errors.ts#errorMessage` formats any thrown value.
- **Permissions**: grant the minimal capability in
  `src-tauri/capabilities/default.json`; `cargo check` validates ids.

## Principles

- **KISS / YAGNI** — simplest thing that works; no speculative abstraction.
- **DRY** — one home per concept (e.g. `samePath`, `basename`, clamp helpers).
- **SOLID (lightly)** — small single-purpose modules; depend on pure functions.
- **Files ≤ ~150 lines** unless justified. `.svelte` files may exceed because of
  template + `<style>`; keep their `<script>` logic thin (push to `.ts`).
- **Comments explain WHY, not what.** No dead code, no redundant comments.

## Testing

- Add a vitest test for any new pure logic (`*.test.ts` next to the module).
- Don't unit-test runes/Tauri/CodeMirror directly — extract the pure core and
  test that. Type-only imports from `*.svelte.ts` are fine (erased at runtime).
- `bun run test` (vitest). `bun run check` (svelte-check, must be 0/0).

## Workflow

- Verify each change: `bun run check` → `bun run test` → `bun run build`, and a
  `bun run tauri dev` boot for runtime/capability changes. Stop dev cleanly and
  free port 1420 afterwards.
- Commit per feature/phase; English message ending with the Co-Authored-By line.
- Release: bump version in `package.json`, `src-tauri/tauri.conf.json`,
  `src-tauri/Cargo.toml` (+ `cargo check` to update `Cargo.lock`), add a
  CHANGELOG entry, tag `vX.Y.Z`, then publish the draft as latest.

## Review checklist

Reuse over reinvention · pure core extracted + tested · no silent failures ·
file under ~150 lines · minimal permissions · no dead code/comments · `check`
+ `test` green.
