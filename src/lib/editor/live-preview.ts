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
import { StateField, type EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import { openUrl } from "@tauri-apps/plugin-opener";
import { convertFileSrc } from "@tauri-apps/api/core";
import katex from "katex";
import mermaid from "mermaid";
import { dirname, toAbsoluteImagePath } from "$lib/md-assets";
import { renderMarkdown } from "$lib/markdown/renderer";
import { settings } from "$lib/stores/settings.svelte";
import {
  headingClass,
  STYLE_CLASS,
  MARKER_NODES,
  markerHidden,
  isFollowableUrl,
  parseImage,
  findMath,
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

class MathWidget extends WidgetType {
  constructor(
    readonly html: string,
    readonly display: boolean,
  ) {
    super();
  }
  eq(o: MathWidget) {
    return o.html === this.html && o.display === this.display;
  }
  toDOM() {
    const el = document.createElement(this.display ? "div" : "span");
    el.className = "cm-lp-math";
    el.innerHTML = this.html; // KaTeX output is trusted markup
    return el;
  }
}

/** Rendered block (table / fenced code) — reuses the preview's sanitized HTML. */
class HtmlWidget extends WidgetType {
  constructor(readonly html: string) {
    super();
  }
  eq(o: HtmlWidget) {
    return o.html === this.html;
  }
  toDOM() {
    const el = document.createElement("div");
    el.className = "cm-lp-block markdown-body";
    el.innerHTML = this.html; // already sanitized by renderMarkdown
    return el;
  }
}

let mermaidSeq = 0;
async function renderMermaidInto(host: HTMLElement, code: string) {
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: settings.resolvedTheme === "dark" ? "dark" : "default",
      securityLevel: "strict",
    });
    const { svg } = await mermaid.render(`lp-mmd-${mermaidSeq++}`, code);
    host.innerHTML = svg;
  } catch (e) {
    host.textContent = `Mermaid error: ${(e as Error).message}`;
  }
}

class MermaidWidget extends WidgetType {
  constructor(readonly code: string) {
    super();
  }
  eq(o: MermaidWidget) {
    return o.code === this.code;
  }
  toDOM() {
    const el = document.createElement("div");
    el.className = "cm-lp-block cm-lp-mermaid";
    void renderMermaidInto(el, this.code);
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
function activeLines(state: EditorState): Set<number> {
  const lines = new Set<number>();
  const doc = state.doc;
  for (const r of state.selection.ranges) {
    const first = doc.lineAt(r.from).number;
    const last = doc.lineAt(r.to).number;
    for (let n = first; n <= last; n++) lines.add(n);
  }
  return lines;
}

/** True if a position sits inside a fenced/inline code or table node. */
function inCodeOrTable(tree: ReturnType<typeof syntaxTree>, pos: number): boolean {
  for (let n: SyntaxNode | null = tree.resolveInner(pos, 1); n; n = n.parent) {
    if (/Code/i.test(n.name) || n.name === "Table") return true;
  }
  return false;
}

function buildDecorations(view: EditorView, basePath: string | null): DecorationSet {
  const decos: { from: number; to: number; deco: Decoration }[] = [];
  const active = activeLines(view.state);
  const doc = view.state.doc;
  const baseDir = basePath ? dirname(basePath) : null;

  const tree = syntaxTree(view.state);
  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
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
        } else if (node.name === "FencedCode" || node.name === "Table") {
          return false; // handled by the block-decoration field; don't style inside
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

    // Math isn't in the Markdown syntax tree, so scan the text for $…$ / $$…$$.
    const text = doc.sliceString(from, to);
    for (const span of findMath(text)) {
      const sFrom = from + span.from;
      const sTo = from + span.to;
      const firstLine = doc.lineAt(sFrom).number;
      const lastLine = doc.lineAt(sTo).number;
      let activeHere = false;
      for (let n = firstLine; n <= lastLine && !activeHere; n++) activeHere = active.has(n);
      if (activeHere) continue;
      if (inCodeOrTable(tree, sFrom)) continue; // skip code spans/blocks and tables
      let html: string;
      try {
        html = katex.renderToString(span.tex, { displayMode: span.display, throwOnError: false });
      } catch {
        continue;
      }
      decos.push({
        from: sFrom,
        to: sTo,
        deco: Decoration.replace({ widget: new MathWidget(html, span.display) }),
      });
    }
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

// Block widgets (tables, fenced code, Mermaid) must come from a StateField — CM
// forbids block decorations from view plugins. Scans the whole doc (blocks are
// few) and reveals raw source when the cursor is inside a block.
function buildBlockDecorations(state: EditorState, basePath: string | null): DecorationSet {
  const decos: { from: number; to: number; deco: Decoration }[] = [];
  const doc = state.doc;
  const active = activeLines(state);
  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name !== "FencedCode" && node.name !== "Table") return;
      const firstLine = doc.lineAt(node.from).number;
      const lastLine = doc.lineAt(node.to).number;
      let act = false;
      for (let n = firstLine; n <= lastLine && !act; n++) act = active.has(n);
      if (!act) {
        const bFrom = doc.line(firstLine).from;
        const bTo = doc.line(lastLine).to;
        const info = node.node.getChild("CodeInfo");
        const lang = info ? doc.sliceString(info.from, info.to).trim().toLowerCase() : "";
        if (node.name === "FencedCode" && lang === "mermaid") {
          const code = node.node.getChild("CodeText");
          const widget = new MermaidWidget(code ? doc.sliceString(code.from, code.to) : "");
          decos.push({ from: bFrom, to: bTo, deco: Decoration.replace({ widget, block: true }) });
        } else {
          const widget = new HtmlWidget(renderMarkdown(doc.sliceString(bFrom, bTo), basePath));
          decos.push({ from: bFrom, to: bTo, deco: Decoration.replace({ widget, block: true }) });
        }
      }
      return false; // never descend into a block
    },
  });
  decos.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    decos.map((d) => d.deco.range(d.from, d.to)),
    true,
  );
}

function blockField(basePath: string | null) {
  return StateField.define<DecorationSet>({
    create: (state) => buildBlockDecorations(state, basePath),
    update(value, tr) {
      if (
        tr.docChanged ||
        tr.selection ||
        syntaxTree(tr.state) !== syntaxTree(tr.startState)
      ) {
        return buildBlockDecorations(tr.state, basePath);
      }
      return value.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
}

export function livePreview(basePath: string | null = null) {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, basePath);
      }
      update(u: ViewUpdate) {
        // Also rebuild when the background parser advances (tree identity changes),
        // otherwise large docs stay unstyled until the first edit/cursor move.
        if (
          u.docChanged ||
          u.viewportChanged ||
          u.selectionSet ||
          syntaxTree(u.state) !== syntaxTree(u.startState)
        ) {
          this.decorations = buildDecorations(u.view, basePath);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
  return [plugin, blockField(basePath), openLinkOnClick];
}
