// Pure ATX-heading parsing, shared by the outline, folding and TOC. Skips
// fenced code blocks so `# ...` inside code isn't treated as a heading.
import { scanLines } from "$lib/md-lines";

export interface Heading {
  level: number;
  text: string;
  line: number; // 1-based
}

// One-entry memo: the fold service queries this repeatedly with the same doc.
let memoSrc: string | null = null;
let memoResult: Heading[] = [];

export function parseHeadings(src: string): Heading[] {
  if (src === memoSrc) return memoResult;
  const out: Heading[] = [];
  for (const { text, index, isFence, inFence } of scanLines(src)) {
    if (isFence || inFence) continue;
    const m = text.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), line: index + 1 });
  }
  memoSrc = src;
  memoResult = out;
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

/** GitHub-style anchor slug for a heading's text. */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** A Markdown table of contents: a nested list of links to the headings. */
export function buildToc(headings: Heading[]): string {
  if (headings.length === 0) return "";
  const minLevel = Math.min(...headings.map((h) => h.level));
  return headings
    .map((h) => `${"  ".repeat(h.level - minLevel)}- [${h.text}](#${slug(h.text)})`)
    .join("\n");
}
