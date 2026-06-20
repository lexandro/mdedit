// Section folding for the editor: fold a heading down to just before the next
// heading of the same or higher level, plus the standard fold gutter/keymap.
import { foldService, codeFolding, foldGutter } from "@codemirror/language";
import { parseHeadings, sectionEndLine } from "$lib/md-headings";

const headingFold = foldService.of((state, lineStart, lineEnd) => {
  const line = state.doc.lineAt(lineStart);
  if (!/^#{1,6}\s/.test(line.text)) return null; // cheap reject before parsing
  const end = sectionEndLine(parseHeadings(state.doc.toString()), line.number, state.doc.lines);
  if (end == null || end <= line.number) return null;
  return { from: lineEnd, to: state.doc.line(end).to };
});

export function markdownFolding() {
  return [headingFold, codeFolding(), foldGutter()];
}
