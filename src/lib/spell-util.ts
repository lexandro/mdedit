// Pure helper for the editor's native (WebView) spell checker. Kept Tauri/
// CodeMirror-free so it is unit-testable; Editor.svelte feeds the result into
// EditorView.contentAttributes.

/** Content-DOM attributes that toggle the WebView's native spell checker. An
 *  empty `lang` lets the WebView pick the system dictionary. */
export function spellcheckAttrs(enabled: boolean, lang: string): Record<string, string> {
  if (!enabled) return { spellcheck: "false" };
  return lang ? { spellcheck: "true", lang } : { spellcheck: "true" };
}
