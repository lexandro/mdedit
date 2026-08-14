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

/** GitHub-style anchor slug for a heading's text. Letters of any script are
 *  kept (an accented Hungarian heading must not slug down to a stub). */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");
}

/** Slugs in document order, numbering repeats like GitHub does (foo, foo-1, …).
 *  The renderer stamps these on headings as ids and the TOC links to them, so
 *  both sides must walk the document with the same counter. */
export function makeSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text) => {
    const base = slug(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

/** The id a `#…` link targets (percent-decoded), or null for other hrefs. */
export function anchorId(href: string): string | null {
  if (!href.startsWith("#") || href.length < 2) return null;
  const raw = href.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw; // a malformed escape is still a usable literal id
  }
}

/** 1-based line of the heading a `#…` link points at, or null if there is none. */
export function anchorLine(src: string, href: string): number | null {
  const target = anchorId(href);
  if (target === null) return null;
  const nextSlug = makeSlugger();
  for (const h of parseHeadings(src)) if (nextSlug(h.text) === target) return h.line;
  return null;
}

/** A Markdown table of contents: a nested list of links to the headings. */
export function buildToc(headings: Heading[]): string {
  if (headings.length === 0) return "";
  const minLevel = Math.min(...headings.map((h) => h.level));
  const nextSlug = makeSlugger();
  return headings
    .map((h) => `${"  ".repeat(h.level - minLevel)}- [${h.text}](#${nextSlug(h.text)})`)
    .join("\n");
}
