// Pure text logic behind the Markdown formatting commands (no CodeMirror), so
// it is unit-testable. The thin EditorView wrappers live in md-format.ts.

export interface WrapEdit {
  insert: string; // replacement text for the edited span
  fromDelta: number; // edit start, relative to selection start (≤ 0)
  toDelta: number; // edit end, relative to selection end (≥ 0)
  selStart: number; // new selection start, relative to the edit start
  selLen: number; // new selection length
}

/**
 * Toggle inline emphasis markers around a selection.
 *
 * The tricky case: after wrapping, editors keep only the inner text selected, so
 * the markers live just *outside* the selection — a naive check on the selected
 * text alone never detects them and re-wraps forever. `ctxLeft`/`ctxRight` are
 * the doc characters immediately before/after the selection (pass at least
 * before.length+1 / after.length+1 so `**` vs `*` runs are disambiguated).
 */
export function toggleEmphasis(
  sel: string,
  ctxLeft: string,
  ctxRight: string,
  before: string,
  after = before,
): WrapEdit {
  // 1) Markers included in the selection → strip them.
  if (sel.length >= before.length + after.length && sel.startsWith(before) && sel.endsWith(after)) {
    const inner = sel.slice(before.length, sel.length - after.length);
    return { insert: inner, fromDelta: 0, toDelta: 0, selStart: 0, selLen: inner.length };
  }
  // 2) Markers sit just outside the selection → remove them. Guard against a
  //    longer run of the same char so italic `*` doesn't peel a bold `**`.
  const lm = before[0];
  const rm = after[0];
  const leftWrapped =
    ctxLeft.endsWith(before) && !ctxLeft.slice(0, ctxLeft.length - before.length).endsWith(lm);
  const rightWrapped = ctxRight.startsWith(after) && !ctxRight.slice(after.length).startsWith(rm);
  if (leftWrapped && rightWrapped) {
    return { insert: sel, fromDelta: -before.length, toDelta: after.length, selStart: 0, selLen: sel.length };
  }
  // 3) Not wrapped → wrap, keeping the inner text selected.
  return {
    insert: before + sel + after,
    fromDelta: 0,
    toDelta: 0,
    selStart: before.length,
    selLen: sel.length,
  };
}

/** If `pasted` is a bare URL/mailto and there is a selection, return a Markdown
 *  link wrapping the selection; otherwise null (paste normally). */
export function linkFromPaste(selected: string, pasted: string): string | null {
  const url = pasted.trim();
  if (!selected || /\s/.test(url) || !/^(https?:\/\/|mailto:)\S+$/i.test(url)) return null;
  return `[${selected}](${url})`;
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
