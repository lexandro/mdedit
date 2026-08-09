// Section folding for the editor: fold a heading down to just before the next
// heading of the same or higher level, plus the standard fold gutter/keymap.
import { foldService, codeFolding, foldGutter } from "@codemirror/language";
import type { Text } from "@codemirror/state";
import { parseHeadings, sectionEndLine, type Heading } from "$lib/md-headings";

// The fold gutter asks for every visible line, and `doc.toString()` allocates a
// fresh copy of the whole document each time — on a 1 MB file that is megabytes
// of churn per rendered frame. `Text` is immutable per document version, so one
// parse per version serves every query against it.
const headingCache = new WeakMap<Text, Heading[]>();

function headingsOf(doc: Text): Heading[] {
  let headings = headingCache.get(doc);
  if (!headings) {
    headings = parseHeadings(doc.toString());
    headingCache.set(doc, headings);
  }
  return headings;
}

const headingFold = foldService.of((state, lineStart, lineEnd) => {
  const line = state.doc.lineAt(lineStart);
  if (!/^#{1,6}\s/.test(line.text)) return null; // cheap reject before parsing
  const end = sectionEndLine(headingsOf(state.doc), line.number, state.doc.lines);
  if (end == null || end <= line.number) return null;
  return { from: lineEnd, to: state.doc.line(end).to };
});

export function markdownFolding() {
  return [headingFold, codeFolding(), foldGutter()];
}
