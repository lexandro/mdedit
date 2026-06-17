// Markdown -> sanitized HTML pipeline.
// GFM features (tables, autolinks, fenced code) come from markdown-it core;
// task lists from a plugin; code highlighting from highlight.js; Mermaid blocks
// are emitted as <pre class="mermaid"> for Preview.svelte to render client-side.
import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js";
import DOMPurify from "dompurify";

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

export function renderMarkdown(source: string): string {
  const dirty = md.render(source);
  return DOMPurify.sanitize(dirty, {
    ADD_ATTR: ["target", "class", "type", "checked", "disabled"],
    ADD_TAGS: ["input"],
  });
}
