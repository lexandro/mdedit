// Live-preview (WYSIWYG) decorations for CodeMirror: render Markdown inline by
// styling emphasis/headings and hiding their syntax markers — except on the
// line(s) you're editing, where the raw Markdown is revealed so you can edit it.
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { headingClass, STYLE_CLASS, MARKER_NODES, markerHidden } from "./live-preview-core";

const HIDE = Decoration.replace({});

/** Line numbers currently touched by any selection — there we reveal raw Markdown. */
function activeLines(view: EditorView): Set<number> {
  const lines = new Set<number>();
  const doc = view.state.doc;
  for (const r of view.state.selection.ranges) {
    const first = doc.lineAt(r.from).number;
    const last = doc.lineAt(r.to).number;
    for (let n = first; n <= last; n++) lines.add(n);
  }
  return lines;
}

function buildDecorations(view: EditorView): DecorationSet {
  const decos: { from: number; to: number; deco: Decoration }[] = [];
  const active = activeLines(view);
  const doc = view.state.doc;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.to <= node.from) return;
        const styleClass = STYLE_CLASS[node.name];
        if (styleClass) {
          decos.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: styleClass }) });
        } else if (node.name.startsWith("ATXHeading")) {
          const level = Number(node.name.slice("ATXHeading".length)) || 1;
          decos.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: headingClass(level) }) });
        } else if (MARKER_NODES.has(node.name)) {
          const line = doc.lineAt(node.from).number;
          if (markerHidden(line, active)) {
            // Swallow the single space after a heading's "#" markers too.
            let end = node.to;
            if (node.name === "HeaderMark" && doc.sliceString(end, end + 1) === " ") end += 1;
            decos.push({ from: node.from, to: end, deco: HIDE });
          }
        }
      },
    });
  }

  decos.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    decos.map((d) => d.deco.range(d.from, d.to)),
    true,
  );
}

export function livePreview() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged || u.selectionSet) {
          this.decorations = buildDecorations(u.view);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}
