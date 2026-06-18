// Toggle the n-th GFM task item (0-based) in a Markdown source string, matching
// the order of rendered checkboxes. Fenced code is skipped so task-like syntax
// there doesn't count. Pure and unit-tested; used by the preview.
export function toggleTaskInSource(src: string, n: number, checked: boolean): string {
  const lines = src.split("\n");
  let count = -1;
  let fence: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const fm = lines[i].match(/^\s*(```+|~~~+)/);
    if (fm) {
      const mark = fm[1][0];
      if (fence === null) fence = mark;
      else if (lines[i].trim().startsWith(fence)) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const m = lines[i].match(/^(\s*(?:[-*+]|\d+\.)\s+\[)[ xX](\].*)$/);
    if (m && ++count === n) {
      lines[i] = m[1] + (checked ? "x" : " ") + m[2];
      break;
    }
  }
  return lines.join("\n");
}
