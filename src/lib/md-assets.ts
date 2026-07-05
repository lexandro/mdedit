// Pure path resolution for preview images. Decides whether an <img> src should
// be rewritten to a local filesystem path (then served via Tauri's asset
// protocol) or left untouched. Kept Tauri-free so it is unit-testable.

export function dirname(path: string): string {
  const norm = path.replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  return i >= 0 ? norm.slice(0, i) : "";
}

/** Join a relative path onto a base dir, collapsing "." and ".." segments. */
export function joinPath(baseDir: string, rel: string): string {
  const parts = `${baseDir}/${rel.replace(/\\/g, "/")}`.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

/** The absolute filesystem path an image src maps to, or null to leave it as-is
 *  (remote/data URLs, root-relative paths, or relative paths with no base). */
export function toAbsoluteImagePath(src: string, baseDir: string | null): string | null {
  if (!src) return null;
  if (/^(https?|data|blob|asset|mailto|tel):/i.test(src)) return null;
  // markdown-it percent-encodes link destinations (\ -> %5C, space -> %20);
  // convertFileSrc expects a raw filesystem path, so decode first.
  let path = src;
  try {
    path = decodeURIComponent(src);
  } catch {
    /* malformed % sequence: use as-is */
  }
  if (/^[a-zA-Z]:[\\/]/.test(path) || path.startsWith("\\\\")) return path.replace(/\\/g, "/");
  if (baseDir && !path.startsWith("/")) return joinPath(baseDir, path);
  return null;
}
