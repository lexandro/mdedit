// Live-preview (WYSIWYG) decorations for CodeMirror: render Markdown inline by
// styling emphasis/headings, hiding their syntax markers, turning links into
// plain styled text and images/rules into rendered widgets — except on the
// line(s) you're editing, where the raw Markdown is revealed so you can edit it.
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import { openUrl } from "@tauri-apps/plugin-opener";
import { convertFileSrc } from "@tauri-apps/api/core";
import { dirname, toAbsoluteImagePath } from "$lib/md-assets";
import {
  headingClass,
  STYLE_CLASS,
  MARKER_NODES,
  markerHidden,
  isFollowableUrl,
  parseImage,
} from "./live-preview-core";

const HIDE = Decoration.replace({});

class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
  ) {
    super();
  }
  eq(o: ImageWidget) {
    return o.src === this.src && o.alt === this.alt;
  }
  toDOM() {
    const img = document.createElement("img");
    img.className = "cm-lp-img";
    img.src = this.src;
    img.alt = this.alt;
    return img;
  }
}

class HrWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const el = document.createElement("hr");
    el.className = "cm-lp-hr";
    return el;
  }
}

/** Resolve a Markdown image src to something the WebView can load. */
function resolveSrc(url: string, baseDir: string | null): string {
  const abs = toAbsoluteImagePath(url, baseDir);
  if (!abs) return url; // remote/data URL — use as-is
  try {
    return convertFileSrc(abs);
  } catch {
    return url; // not under Tauri
  }
}

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

function buildDecorations(view: EditorView, baseDir: string | null): DecorationSet {
  const decos: { from: number; to: number; deco: Decoration }[] = [];
  const active = activeLines(view);
  const doc = view.state.doc;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.to <= node.from) return;
        const line = doc.lineAt(node.from).number;
        const styleClass = STYLE_CLASS[node.name];

        if (styleClass) {
          decos.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: styleClass }) });
        } else if (node.name.startsWith("ATXHeading")) {
          const level = Number(node.name.slice("ATXHeading".length)) || 1;
          decos.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: headingClass(level) }) });
        } else if (node.name === "Image") {
          if (!markerHidden(line, active)) return;
          const img = parseImage(doc.sliceString(node.from, node.to));
          if (img) {
            const widget = new ImageWidget(resolveSrc(img.url, baseDir), img.alt);
            decos.push({ from: node.from, to: node.to, deco: Decoration.replace({ widget }) });
          }
        } else if (node.name === "HorizontalRule") {
          if (markerHidden(line, active)) {
            decos.push({ from: node.from, to: node.to, deco: Decoration.replace({ widget: new HrWidget() }) });
          }
        } else if (node.name === "Link") {
          // Show only the link text, styled; hide the [..](url) syntax off the active line.
          decos.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: "cm-lp-link" }) });
          if (markerHidden(line, active)) {
            for (let c = node.node.firstChild; c; c = c.nextSibling) {
              if (c.name === "LinkMark" || c.name === "URL" || c.name === "LinkTitle") {
                decos.push({ from: c.from, to: c.to, deco: HIDE });
              }
            }
          }
        } else if (MARKER_NODES.has(node.name)) {
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

/** Markdown link/image URL enclosing a document position, if any. */
function linkUrlAt(view: EditorView, pos: number): string | null {
  let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(pos, 1);
  for (; node; node = node.parent) {
    if (node.name === "Link" || node.name === "Image") {
      const url = node.getChild("URL");
      return url ? view.state.sliceDoc(url.from, url.to) : null;
    }
  }
  return null;
}

// Ctrl/Cmd-click a rendered link to open it (plain click just edits the source).
const openLinkOnClick = EditorView.domEventHandlers({
  mousedown(e, view) {
    if (!(e.ctrlKey || e.metaKey)) return false;
    const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
    if (pos == null) return false;
    const url = linkUrlAt(view, pos);
    if (url && isFollowableUrl(url)) {
      openUrl(url).catch(() => {});
      e.preventDefault();
      return true;
    }
    return false;
  },
});

export function livePreview(basePath: string | null = null) {
  const baseDir = basePath ? dirname(basePath) : null;
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, baseDir);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged || u.selectionSet) {
          this.decorations = buildDecorations(u.view, baseDir);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
  return [plugin, openLinkOnClick];
}
