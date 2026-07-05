// Pure path resolution for preview images. Decides whether an <img> src should
// be rewritten to a local filesystem path (then served via Tauri's asset
// protocol) or left untouched. Kept Tauri-free so it is unit-testable.

/** Normalize a Windows path to forward slashes, dropping the `\\?\`
 *  extended-length prefix. The one home for separator normalization. */
export function toPosix(path: string): string {
  return path.replace(/^\\\\\?\\/, "").replace(/\\/g, "/");
}

export function dirname(path: string): string {
  const norm = toPosix(path);
  const i = norm.lastIndexOf("/");
  return i >= 0 ? norm.slice(0, i) : "";
}

/** Join a relative path onto a base dir, collapsing "." and ".." segments. */
export function joinPath(baseDir: string, rel: string): string {
  const parts = `${baseDir}/${toPosix(rel)}`.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

/** Percent-encode the characters that would break an unbracketed Markdown link
 *  destination (a space truncates the src, parens delimit it). The result
 *  round-trips back through `toAbsoluteImagePath`'s decode step on render. */
export function encodeMarkdownLinkPath(path: string): string {
  return path.replace(
    /[ ()#?%]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"),
  );
}

/** Whether a src resolves to a UNC path (`\\host\share` or `//host/share`).
 *  A document is untrusted input, so a UNC image src must never reach the file
 *  layer: on Windows, opening `\\host\share` triggers an SMB connection that
 *  leaks NTLM credentials. Decode first, since markdown-it emits `%5C%5C`. */
export function isUncPath(src: string): boolean {
  let path = src;
  try {
    path = decodeURIComponent(src);
  } catch {
    /* malformed % sequence: test as-is */
  }
  return /^[\\/]{2}/.test(path);
}

/** The absolute filesystem path an image src maps to, or null to leave it as-is
 *  (remote/data URLs, UNC paths, root-relative paths, or relative paths with no
 *  base). */
export function toAbsoluteImagePath(src: string, baseDir: string | null): string | null {
  if (!src) return null;
  if (/^(https?|data|blob|asset|mailto|tel):/i.test(src)) return null;
  if (isUncPath(src)) return null; // never hand a UNC path to the file layer
  // markdown-it percent-encodes link destinations (\ -> %5C, space -> %20);
  // convertFileSrc expects a raw filesystem path, so decode first.
  let path = src;
  try {
    path = decodeURIComponent(src);
  } catch {
    /* malformed % sequence: use as-is */
  }
  if (/^[a-zA-Z]:[\\/]/.test(path)) return toPosix(path);
  if (baseDir && !path.startsWith("/")) return joinPath(baseDir, path);
  return null;
}
