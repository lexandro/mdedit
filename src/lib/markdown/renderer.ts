// Markdown -> sanitized HTML pipeline.
// GFM features (tables, autolinks, fenced code) come from markdown-it core;
// task lists from a plugin; code highlighting from highlight.js; Mermaid blocks
// are emitted as <pre class="mermaid"> for Preview.svelte to render client-side.
import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import { convertFileSrc } from "@tauri-apps/api/core";

function dirname(path: string): string {
  const norm = path.replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  return i >= 0 ? norm.slice(0, i) : "";
}

/** Join a relative path onto a base dir, collapsing "." and ".." segments. */
function joinPath(baseDir: string, rel: string): string {
  const parts = `${baseDir}/${rel.replace(/\\/g, "/")}`.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

/** Resolve an <img> src so local files load through Tauri's asset protocol.
 *  Absolute URLs and data/blob URIs pass through; a relative path is resolved
 *  against the open document's folder. */
function resolveAssetSrc(src: string, baseDir: string | null): string {
  if (!src) return src;
  if (/^(https?|data|blob|asset|mailto|tel):/i.test(src)) return src;
  let abs: string | null = null;
  if (/^[a-zA-Z]:[\\/]/.test(src) || src.startsWith("\\\\")) {
    abs = src.replace(/\\/g, "/"); // already absolute (Windows / UNC)
  } else if (baseDir && !src.startsWith("/")) {
    abs = joinPath(baseDir, src); // relative to the document
  }
  if (!abs) return src;
  try {
    return convertFileSrc(abs);
  } catch {
    return src; // not running under Tauri
  }
}

const md = new MarkdownIt({
  html: false, // we never trust raw HTML; DOMPurify is a second line of defense
  linkify: true,
  typographer: true,
  breaks: false,
  highlight(code, lang): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      } catch {
        /* fall through */
      }
    }
    return ""; // let markdown-it escape it
  },
});

md.use(taskLists, { enabled: true, label: true });

// Override fenced code so ```mermaid blocks become Mermaid containers.
const defaultFence =
  md.renderer.rules.fence ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const lang = token.info.trim().split(/\s+/)[0];
  if (lang === "mermaid") {
    // Mermaid reads textContent; escape to keep it inert until mermaid.run().
    return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>`;
  }
  return defaultFence(tokens, idx, options, env, self);
};

// Resolve relative image sources against the open document's folder so local
// images render in the preview (via the Tauri asset protocol).
const defaultImage =
  md.renderer.rules.image ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet("src");
  if (src) token.attrSet("src", resolveAssetSrc(src, (env?.baseDir as string | null) ?? null));
  return defaultImage(tokens, idx, options, env, self);
};

// Open links in the default browser instead of navigating the webview.
const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet("href");
  if (href && /^https?:/i.test(href)) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// Allow the attributes markdown-it/task-lists/our rules emit, after sanitizing.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function renderMarkdown(source: string, basePath?: string | null): string {
  const baseDir = basePath ? dirname(basePath) : null;
  const dirty = md.render(source, { baseDir });
  return DOMPurify.sanitize(dirty, {
    ADD_ATTR: ["target", "class", "type", "checked", "disabled"],
    ADD_TAGS: ["input"],
  });
}
