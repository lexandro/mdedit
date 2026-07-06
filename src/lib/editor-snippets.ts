// CodeMirror bridge for snippets: expands the pure definitions from
// snippets.ts into the editor, via the picker (insertSnippet) or the inline
// /trigger completion source. Variables are expanded at apply time so the
// inserted date/time is always fresh.
import { snippet, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import { expandVariables, matchTrigger, type Snippet } from "$lib/snippets";
import { snippets } from "$lib/stores/snippets.svelte";
import { getActiveView } from "$lib/editor-commands";
import { settings } from "$lib/stores/settings.svelte";
import { t } from "$lib/i18n";

/** User snippets carry their own label; built-ins localize via `snippet.${id}`. */
export function snippetLabel(s: Snippet): string {
  return s.label ?? t(`snippet.${s.id}`);
}

function expand(s: Snippet): string {
  return expandVariables(s.body, {
    now: new Date(),
    format: settings.dateFormat,
    locale: settings.language,
  });
}

// Field-less bodies bypass snippet(): it would leave the cursor before the
// inserted text when there is no ${...} to select.
function applyBody(view: EditorView, body: string, from: number, to: number) {
  if (body.includes("${")) snippet(body)(view, null, from, to);
  else
    view.dispatch({
      changes: { from, to, insert: body },
      selection: { anchor: from + body.length },
      userEvent: "input",
    });
}

/** Picker path: expand over the active editor's current selection. */
export function insertSnippet(s: Snippet): void {
  const view = getActiveView();
  if (!view) return;
  const { from, to } = view.state.selection.main;
  applyBody(view, expand(s), from, to);
  view.focus();
}

/** Inline /trigger completion source, registered via autocompletion override. */
export function snippetSource(ctx: CompletionContext): CompletionResult | null {
  const line = ctx.state.doc.lineAt(ctx.pos);
  const start = matchTrigger(line.text.slice(0, ctx.pos - line.from));
  if (start == null && !ctx.explicit) return null;
  return {
    from: start == null ? ctx.pos : line.from + start,
    options: snippets.all.map((s) => ({
      label: "/" + s.trigger,
      detail: snippetLabel(s),
      apply: (view, _completion, from, to) => applyBody(view, expand(s), from, to),
    })),
    validFor: /^\/[\w-]*$/,
  };
}
