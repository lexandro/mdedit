// Split leading YAML frontmatter (--- ... ---) from the Markdown body, so the
// preview can show it as a metadata block instead of rendering it as an <hr>
// plus an accidental setext heading.
export function splitFrontmatter(src: string): { frontmatter: string | null; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(src);
  if (m) return { frontmatter: m[1], body: src.slice(m[0].length) };
  return { frontmatter: null, body: src };
}
