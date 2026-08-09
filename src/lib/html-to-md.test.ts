import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "./html-to-md";

describe("htmlToMarkdown", () => {
  it("converts inline formatting", async () => {
    expect(await htmlToMarkdown("<b>bold</b> and <i>it</i>")).toBe("**bold** and *it*");
  });
  it("converts headings and links", async () => {
    expect(await htmlToMarkdown("<h2>Title</h2>")).toBe("## Title");
    expect(await htmlToMarkdown('<a href="http://x">link</a>')).toBe("[link](http://x)");
  });
  it("converts GFM tables", async () => {
    const html =
      "<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    expect(await htmlToMarkdown(html)).toContain("| a | b |");
  });
  it("converts lists", async () => {
    const md = await htmlToMarkdown("<ul><li>one</li><li>two</li></ul>");
    expect(md).toMatch(/^- +one\n- +two$/);
  });
});
