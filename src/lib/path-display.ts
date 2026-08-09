// Recent-file rows show *where* a file lives. The interesting part of
// "C:\Users\me\AppData\Local\Temp\claude\<guid>\scratchpad\big.md" is the tail,
// so trimming from the right — which is what text-overflow does — hides exactly
// the part worth reading. Trim whole segments off the front instead.

/** The folder containing `path`, keeping as many trailing segments as fit in
 *  `maxChars`. Shorter folders are returned whole; longer ones get a leading
 *  ellipsis. Always keeps at least the immediate parent. */
export function displayDir(path: string, maxChars = 46): string {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(/[\\/]/);
  parts.pop(); // drop the file name — it is shown separately
  if (parts.length === 0) return "";

  const kept: string[] = [];
  let len = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    const cost = parts[i].length + (kept.length > 0 ? 1 : 0); // +1 for the separator
    if (kept.length > 0 && len + cost > maxChars) break;
    kept.unshift(parts[i]);
    len += cost;
  }
  return (kept.length < parts.length ? "…" + sep : "") + kept.join(sep);
}
