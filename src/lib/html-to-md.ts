// Convert an HTML fragment (e.g. rich text from the clipboard) to GFM Markdown.
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const service = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});
service.use(gfm);

export function htmlToMarkdown(html: string): string {
  return service.turndown(html).trim();
}
