// Recent-file rows show the whole path on one line, with the file name in bold
// at the end. When it doesn't fit, the MIDDLE is dropped rather than either end:
// the head says which drive, the tail says which folder and which file — and
// those are the two parts worth reading. Whole segments are removed so the
// result still looks like a path.

export interface ElidedPath {
  /** Directory portion, middle-elided, ending in a separator. */
  prefix: string;
  /** File name, always shown in full. */
  name: string;
}

export function elidePath(path: string, maxChars = 90): ElidedPath {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(/[\\/]/);
  const name = parts.pop() ?? "";
  if (parts.length === 0) return { prefix: "", name };

  const full = parts.join(sep) + sep;
  if (full.length + name.length <= maxChars) return { prefix: full, name };

  const root = parts[0]; // "C:" on Windows, "" for a posix absolute path
  const rest = parts.slice(1);
  const head = root + sep + "…" + sep;
  let budget = maxChars - name.length - head.length;

  const tail: string[] = [];
  for (let i = rest.length - 1; i >= 0; i--) {
    const cost = rest[i].length + 1; // segment plus its separator
    if (tail.length > 0 && cost > budget) break; // always keep the parent folder
    tail.unshift(rest[i]);
    budget -= cost;
  }

  // Everything survived after all (only possible for odd inputs) — no ellipsis.
  if (tail.length === rest.length) return { prefix: full, name };
  return { prefix: head + (tail.length > 0 ? tail.join(sep) + sep : ""), name };
}
