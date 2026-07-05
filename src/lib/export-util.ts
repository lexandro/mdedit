// Pure helpers for the export pipeline (Tauri-free so they are unit-testable).

/** Whether an <img> src points at a Tauri-served local asset that only resolves
 *  inside the app webview. Such srcs must be inlined (base64) before a document
 *  is exported to disk or copied, or they become dead links elsewhere. Remote
 *  (http/https), data:, and relative srcs are left alone. */
export function isInlinableAssetUrl(src: string): boolean {
  return /^(https?:\/\/(asset|tauri)\.localhost\/|asset:|tauri:)/i.test(src);
}
