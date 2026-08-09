// Convert an HTML fragment (e.g. rich text from the clipboard) to GFM Markdown.
// Turndown is only needed when the user pastes HTML, so it loads on first use.
import type TurndownService from "turndown";

let loading: Promise<TurndownService> | null = null;

function load(): Promise<TurndownService> {
  loading ??= (async () => {
    const [{ default: Turndown }, { gfm }] = await Promise.all([
      import("turndown"),
      import("turndown-plugin-gfm"),
    ]);
    const service = new Turndown({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*",
    });
    service.use(gfm);
    return service;
  })();
  return loading;
}

/** Start loading Turndown without converting anything (idle prewarm). */
export const preloadHtmlToMarkdown = load;

export async function htmlToMarkdown(html: string): Promise<string> {
  return (await load()).turndown(html).trim();
}
