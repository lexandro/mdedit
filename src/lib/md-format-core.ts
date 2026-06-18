// Pure text logic behind the Markdown formatting commands (no CodeMirror), so
// it is unit-testable. The thin EditorView wrappers live in md-format.ts.

/** Wrap text with markers, or unwrap it if already wrapped (toggle). */
export function toggleWrap(text: string, before: string, after = before): string {
  const wrapped =
    text.length >= before.length + after.length && text.startsWith(before) && text.endsWith(after);
  return wrapped ? text.slice(before.length, text.length - after.length) : before + text + after;
}

const LIST_RE = /^(\s*)([-*+]|\d+[.)])(\s+)(\[[ xX]\]\s+)?(.*)$/;

export type ListAction = { exit: true } | { prefix: string } | null;

/** Decide what Enter should do on a list line: exit (empty item), continue with
 *  the next marker, or nothing (not a list line). */
export function nextListPrefix(line: string): ListAction {
  const m = line.match(LIST_RE);
  if (!m) return null;
  const [, indent, marker, space, checkbox, content] = m;
  if (content.trim() === "") return { exit: true };
  const nextMarker = /^\d+[.)]$/.test(marker)
    ? `${parseInt(marker, 10) + 1}${marker.slice(-1)}`
    : marker;
  return { prefix: indent + nextMarker + space + (checkbox ? "[ ] " : "") };
}
