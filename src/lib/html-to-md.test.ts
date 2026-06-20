import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "./html-to-md";

describe("htmlToMarkdown", () => {
  it("converts inline formatting", () => {
    expect(htmlToMarkdown("<b>bold</b> and <i>it</i>")).toBe("**bold** and *it*");
  });
  it("converts headings and links", () => {
    expect(htmlToMarkdown("<h2>Title</h2>")).toBe("## Title");
    expect(htmlToMarkdown('<a href="http://x">link</a>')).toBe("[link](http://x)");
  });
  it("converts GFM tables", () => {
    const html =
      "<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    expect(htmlToMarkdown(html)).toContain("| a | b |");
  });
  it("converts lists", () => {
    const md = htmlToMarkdown("<ul><li>one</li><li>two</li></ul>");
    expect(md).toMatch(/^- +one\n- +two$/);
  });
});
