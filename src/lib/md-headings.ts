// Pure ATX-heading parsing, shared by the outline, folding and TOC. Skips
// fenced code blocks so `# ...` inside code isn't treated as a heading.
export interface Heading {
  level: number;
  text: string;
  line: number; // 1-based
}

export function parseHeadings(src: string): Heading[] {
  const lines = src.split("\n");
  const out: Heading[] = [];
  let fence: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (fence === null) fence = marker;
      else if (line.trim().startsWith(fence)) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), line: i + 1 });
  }
  return out;
}

/** Last line (1-based) of the section opened by the heading on `line`, i.e. the
 *  line before the next heading of the same or higher level (else the doc end). */
export function sectionEndLine(headings: Heading[], line: number, totalLines: number): number | null {
  const idx = headings.findIndex((h) => h.line === line);
  if (idx === -1) return null;
  const level = headings[idx].level;
  const next = headings.slice(idx + 1).find((h) => h.level <= level);
  return next ? next.line - 1 : totalLines;
}
